// spp.cpp: sparce pairing probabilities
// spits out the pairing probability values for a sequence
// with optional constraints
// rows of x1 y1 p1 x2 y2 p2...
#include <stdlib.h>
#include <time.h>
#include <string.h>
#include <ctype.h>
#include <math.h>
#include <stdio.h>
#include <limits.h>
#include <unistd.h>
#include <omp.h>

extern "C" {
#include "RNAstruct.h"
#include "fold_vars.h"
#include "fold.h"
#include "params.h"
#include "part_func.h"
#include "utils.h"
#include "convert_epars.h"
#include "read_epars.h"
#include "MEA.h"
}

#define dbg 0

int t = 0;

double* prob_seq_const(
    char* seq,
    char* constrain,
    double *mfe_p,
    char **shape_p,
    double bonus )
{
    double feBase = 5.27;
    int length = strlen( seq );
    size_t nbytes = (length+1)*(length+1)*sizeof(double);
    double scale = 1.0;
    double* probs = (double*)malloc(nbytes);
    memset((void*)probs,0,nbytes);
    int* ix = get_iindx( length );
    double betaScale = 1.0;
    double kT = (betaScale*((temperature+K0)*GASCONST))/1000.; /* in Kcal */
    model_detailsT md;
    set_model_details(&md);
    fold_constrained = (constrain ? 1 : 0);
    char* secstr = strdup( seq ); secstr[0] = 0;
    char *cons = 0;
    if (fold_constrained) {
        for (int i = 0; i<length ; i++) {
            secstr[i] = constrain[i];
        }
        secstr[length] = 0;
        cons = strdup( secstr );
    } else {
        secstr[0] = 0;
    }
    paramT* params = get_scaled_parameters(temperature, md);
    double min_en = fold_par( seq, secstr, params, fold_constrained, 0 );
    if (mfe_p) *mfe_p = min_en + bonus;
    #pragma omp critical(inc_scored)
    double pf_scale = exp(-(1.07*min_en)/kT/length);
    pf_paramT* pf_params = get_boltzmann_factors(temperature, betaScale, md, pf_scale);
    #pragma omp critical(pf_fold)
    double e = pf_fold_par( seq, cons, pf_params, 1, fold_constrained, 0 );
    FLT_OR_DBL* ppm = export_bppm();
#define pr_ij(i,j) (i == j? 0.0 : (i < j ? ppm[ix[i]-j] : ppm[ix[j]-i]))
    int r, c;
    for( r = 1; r <= length; r++ ) {
        for( c = 1; c <= length ; c++ ) {
            double v = pr_ij(r, c);
            probs[r*(length+1)+c] += scale*v;
        }
    }
    free( pf_params );
    free( params );
    if (shape_p) *shape_p = secstr;
    else free( secstr );
    if (cons) free( cons );
    free( ix );
//    for (c=1; c<=length; c++) {
//        double sum = 0.0;
//        for (r=1; r<=length; r++) {
//            sum += probs[r*(length+1)+c];
//        }
//        if (sum>1.0) sum = 1.0;
//        probs[c] = 1.0 - sum;
//    }
    return probs;
}

static double FEBase = 5.27;

static double FEToWeight(double fe) {
    return pow(FEBase,-fe);
}

void print_seq_aptamer( char* seq, char* constrain, double bonus )
{
    double eps = 1.0e-6;
    int length = strlen( seq );
    double mfe1, mfe2;
    char *shape = (char*)0;
    double* probs =
        prob_seq_const( seq, (char*)0, &mfe1, &shape, 0.0 );
    double* probs2 = (double*)0;
    int fold_constrained = constrain ? 1 : 0;
    if (fold_constrained) {
        printf("%s %s %6.2f\n", seq, constrain, bonus);
        printf("%s %7.2f\n", shape, mfe1);
        free((void*)shape);
        shape = (char*)0;
        // probs = prob_seq_const( seq, constrain, &mfe, &shape, bonus );
        probs2 = prob_seq_const( seq, constrain, &mfe2, &shape, bonus );
        printf("%s %7.2f\n", shape, mfe2);
    } else {
        printf("%s\n", seq);
        printf("%s %7.2f\n", shape, mfe1);
        printf("%s %7.2f\n", shape, mfe1);
    }
    int r, c;
    for( r = 1; r <= length; r++ ) {
        for( c = r+1; c <= length ; c++ ) {
            double v = probs[r*(length+1) + c];
            if (v>eps) printf( "%d %d %11.9f\n", r, c, v);
        }
    }
    if (probs2) {
        double scale = 0.0;
        double b = FEToWeight(-mfe1+mfe2);
        double b2 = FEToWeight(-mfe1+mfe2-bonus);
        //fprintf(stderr, "bonus=%6.2f mfe1=%6.2f mfe2=%6.2f b=%6.2f b2=%6.2f\n",
        //    bonus, mfe1, mfe2, b, b2);
        for( r = 1; r <= length; r++ ) {
            double sum = probs[c];
            for( c = r+1; c <= length ; c++ ) {
                probs2[r*(length+1)+c] = 
                    probs2[r*(length+1)+c]*b + probs[r*(length+1)+c];
                sum += probs2[r*(length+1)+c];
            }
            scale = fmax(scale,sum);
        }
        //fprintf(stderr, "scale=%6.2f\n", scale);
        for( r = 1; r <= length; r++ ) {
            double sum = 0.0;
            for( c = r+1; c <= length ; c++ ) {
                double v = probs2[r*(length+1) + c]/scale;
                sum += v;
                if (v>eps) printf( "%d %d %11.9f\n", c, r, v);
            }
            double v0 = 1.0 - fmin(1.0,sum);
            if (v0>eps) printf( "%d %d %11.9f\n", r, 0, v0);
        }
    }
    free( shape );
    free( probs );
    free( probs2 );
}

int main( int argc, char** argv)
{
    char *seq = 0;
    char *constrain = 0;
    double bonus = -4.00;
    char *p;
    char line[512];
    //fprintf(stderr, "argc==%d\n", argc);
    if (argc>=2) seq = argv[1];
    if (argc>=3) constrain = argv[2];
    if (argc>=4) bonus = strtod(argv[3], (char**)0);
    else if ( argc < 2 ) {
	seq = fgets(line, sizeof(line), stdin);
	if (!seq) return -1;
	if ((p = strchr(seq,'\n'))) *p = 0;
	if ((p = strchr(seq,'\r'))) *p = 0;
	if ((p = strchr(seq,' '))) *p = 0;
	if ((p = strchr(seq,','))) *p = 0;
	if (strlen(seq)==0) return 1;
    }
    //fprintf(stderr, "seq=%s\n", seq);
    //if (constrain) fprintf(stderr, "con=%s\n", constrain);
    //fprintf(stderr, "bonus=%6.2f\n", bonus);
    print_seq_aptamer( seq, constrain, bonus );
    return 0;
}

