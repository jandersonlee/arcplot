// dpfe.cpp: base pairing generator
// spits out the pairing probability values for a sequence in pgm format
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

float epsilon = 0.01;

int num_seq;
int num_bc  = 4*4*4*4*4*4*4;
int num_loc = 6*6*6*6*6*6*6;
int t = 0;

float**        values;       //   [num_seq][num_loc]
int*           num_computed; //   [num_seq]
unsigned int** val_loc;      //   [num_seq][num_loc]

char** seqs = NULL;
int nseqs = 0;
char** tabu = NULL;
int ntabu = 0;

int num_scored = 0;

// C U A G
char bases[] = "CUAG";
int pmap[] = { 0x03, 0x0C, 0x09, 0x06, 0x07, 0x0D };
int rev_pmap[] = { -1, -1, -1, 0, -1, -1, 3, 4, -1, 2, -1, -1, 1, 5, -1, -1 };

bool is_legal( char* seq, bool strict )
{
    if( strstr( seq, "AAAAAA" ) ) return false;
    if( strstr( seq, "CCCC" ) ) return false;
    if( strstr( seq, "GGGG" ) ) return false;
    return true;
}

void print_seq_bp( char* seq )
{
    printf("%s\n", seq);
    if( !is_legal( seq, true ) ) return;
    
    int length = strlen( seq );
    int* ix = get_iindx( length );
        
    double betaScale = 1.0;
    double kT = (betaScale*((temperature+K0)*GASCONST))/1000.; /* in Kcal */
    model_detailsT md;
    set_model_details(&md);
        
    char* secstr = strdup( seq ); secstr[0] = 0;
    fold_constrained = 0;
    paramT* params = get_scaled_parameters(temperature, md);
    double min_en = fold_par( seq, secstr, params, fold_constrained, 0 );
    #pragma omp critical(inc_scored)
    num_scored++;
    
    double pf_scale = exp(-(1.07*min_en)/kT/length);
    pf_paramT* pf_params = get_boltzmann_factors(temperature, betaScale, md, pf_scale);

    #pragma omp critical(pf_fold)                                                                    
    double e = pf_fold_par( seq, NULL, pf_params, 1, fold_constrained, 0 );
    FLT_OR_DBL* ppm = export_bppm();

#define pr_ij(i,j) (i == j? 0.0 : (i < j ? ppm[ix[i]-j] : ppm[ix[j]-i]))

    int i, j;
    for( i = 1; i <= length; i++ ) {
        for( j = 1; j <= length ; j++ ) {
            double v = pr_ij(i, j);
            printf( "%9.6f,", v);
        }
	printf("\n");
    }

    free( pf_params );
    free( params );
    free( secstr );
    free( ix );
}

// grayscale from 0..63 for approx Free Energy log scale of 0.0 to -6.3 kcal
// 1.0 maps to 0, 0.1 is 14, 0.01 is 28, and >0.00003 to 63
// Each grayscale level is about 15% weaker bonding
int weightToGray( double w )
{
    double feBase = 5.27;
    if (w<0.00001) return 63;
    double lw = log(w) / log(feBase);
    int gray63 = round(fmax(0.0, fmin(63.0, -lw*10.0)));
    //printf( "%7.4f %3d\n", lw, gray63);
    return gray63;
}

// logscale from 0..999 for approx Free Energy log scale of 0.0 to -9.9 kcal
// 1.0 maps to 0, 0.1 is 140, 0.01 is 280, and >0.000001 to 999
// Each grayscale level is about 1.5% weaker bonding
int probToFE( double w )
{
    double feBase = 5.27;
    if (w<0.000001) return 999;
    double lw = log(w) / log(feBase);
    int gray999 = round(fmax(0.0, fmin(999.0, -lw*100.0)));
    //printf( "%7.4f %3d\n", lw, gray999);
    return gray999;
}

// constrain: .>x ?>. (x)=(x)
double* prob_seq_const(
    char* seq,
    char* constrain,
    double *mfe_p,
    char **shape_p,
    double bonus,
    double *probsin )
{
    double feBase = 5.27;
    int length = strlen( seq );
    size_t nbytes = (length+1)*(length+1)*sizeof(double);
    double scale = 1.0;
    double* probs = probsin;
    if (!probsin) {
        probs = (double*)malloc(nbytes);
        memset((void*)probs,0,nbytes);
    } else {
        scale = (bonus>=0.0 ? pow(feBase, bonus)-1.0 : 1.0);
        if (bonus<0.0) memset((void*)probs,0,nbytes);
    }
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
            if (constrain[i]=='.') secstr[i]='x';
            else if (constrain[i]=='-') secstr[i]='.';
            else secstr[i] = constrain[i];
        }
        secstr[length] = 0;
        cons = strdup( secstr );
    } else {
        secstr[0] = 0;
    }
    paramT* params = get_scaled_parameters(temperature, md);
    double min_en = fold_par( seq, secstr, params, fold_constrained, 0 );
    if (mfe_p) *mfe_p = min_en - bonus;
    #pragma omp critical(inc_scored)
    num_scored++;
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
    double scalef = 1.0;
    if (probsin) {
        // compute scale factor for aptamer bonus case
        for (c=0; c<=length; c++) {
            double sum = 0.0;
            for (r=0; r<=length; r++) {
                sum += probs[r*(length+1)+c];
            }
            if (sum>scalef) scalef = sum;
        }
        //fprintf(stderr, "bonus==%f\n", bonus);
        //fprintf(stderr, "scale==%f\n", scale);
        //fprintf(stderr, "scalef==%f\n", scalef);
    }
    for (c=1; c<=length; c++) {
        double sum = 0.0;
        for (r=1; r<=length; r++) {
            probs[r*(length+1)+c] /= scalef;
            sum += probs[r*(length+1)+c];
        }
        if (sum>1.0) sum = 1.0;
        probs[c] = 1.0 - sum;
    }
    return probs;
}

// constrain: .>x ?>. (x)=(x)
void print_seq_aptamer( char* seq, char* constrain, double bonus )
{
    int length = strlen( seq );
    double mfe;
    char *shape = (char*)0;
    double* probs =
        prob_seq_const( seq, (char*)0, &mfe, &shape, 0.0, (double*)0 );
    int fold_constrained = (constrain ? 1 : 0);
    if (fold_constrained) {
        free((void*)shape);
        printf("P2\n#%s %s\n", seq, constrain);
        probs = prob_seq_const( seq, constrain, &mfe, &shape, bonus, probs );
    } else {
        printf("P2\n#%s\n", seq);
    }
    printf("#%s %7.2f\n%d %d 999\n", shape, mfe, length+1, length+1);
    int r, c;
    for( r = 0; r <= length; r++ ) {
        for( c = 0; c <= length ; c++ ) {
            double v = probs[r*(length+1) + c];
            printf( "%3d ", probToFE(v));
        }
	printf("\n");
    }
    free( shape );
    free( probs );
}

// constrain: .>x ?>. (x)=(x)
void print_seq_dppgm( char* seq, char* constrain )
{
    if( !is_legal( seq, true ) ) return;
    int length = strlen( seq );
    int* ix = get_iindx( length );
    double betaScale = 1.0;
    double kT = (betaScale*((temperature+K0)*GASCONST))/1000.; /* in Kcal */
    model_detailsT md;
    set_model_details(&md);
    printf("P2\n");
    int fold_constrained = (constrain ? 1 : 0);
    char* secstr = strdup( seq ); secstr[0] = 0;
    char *cons = 0;
    if (fold_constrained) {
        for (int i = 0; i<length ; i++) {
            if (constrain[i]=='.') secstr[i]='x';
            else if (constrain[i]=='-') secstr[i]='.';
            else secstr[i] = constrain[i];
        }
        secstr[length] = 0;
        printf("#%s %s\n", seq, constrain);
        cons = strdup( secstr );
    } else {
        printf("#%s\n", seq);
        secstr[0] = 0;
    }
    paramT* params = get_scaled_parameters(temperature, md);
    double min_en = fold_par( seq, secstr, params, fold_constrained, 0 );
    printf("#%s %7.2f\n%d %d 63\n", secstr, min_en, length, length);
    #pragma omp critical(inc_scored)
    num_scored++;
    double pf_scale = exp(-(1.07*min_en)/kT/length);
    pf_paramT* pf_params = get_boltzmann_factors(temperature, betaScale, md, pf_scale);
    #pragma omp critical(pf_fold)
    double e = pf_fold_par( seq, cons, pf_params, 1, fold_constrained, 0 );
    FLT_OR_DBL* ppm = export_bppm();
#define pr_ij(i,j) (i == j? 0.0 : (i < j ? ppm[ix[i]-j] : ppm[ix[j]-i]))
    int i, j;
    for( i = 1; i <= length; i++ ) {
        for( j = 1; j <= length ; j++ ) {
            double v = pr_ij(i, j);
            printf( "%2d ", weightToGray(v));
        }
	printf("\n");
    }
    free( pf_params );
    free( params );
    free( secstr );
    if (cons) free( cons );
    free( ix );
}

int load_file( char* filename )
{
    FILE *f = fopen( filename, "rt" );
    if( f ) {
        char* line = NULL;
        size_t len = 0;
        ssize_t r;
        do {
            r = getline( &line, &len, f );
            if( r >= 0 ) {
                int l = strspn( line, "AUGC" );
                if( l >= 7 ) {
                    line[l] = 0;
                    if( l >= 41 && strncmp( line, "GG", 2 )==0
                        && strcmp( line+l-20, "AAAGAAACAACAACAACAAC" )==0 ) {
                        // has lab tails, so it's a player-reserved barcode
                        ntabu++;
                        tabu = (char**) realloc( tabu, ntabu * sizeof(char*) );
                        line[l-21] = 0;
                        tabu[ntabu - 1] = strdup( line+l-28 );
                    }
                    else {
                        if( !is_legal( line, false ) ) {
                            printf( "Warning, illegal sequence %s excluded.\n", line );
                        }
                        else {
                            // add to the list
                            nseqs++;
                            seqs = (char**) realloc( seqs, nseqs * sizeof(char*) );
                            seqs[nseqs - 1] = strdup( line );
                        }
                    }
                }
            }
            free( line );
            line = NULL;
            len = 0;
        } while( r >= 0 );
        fclose( f );
    }
    
    return nseqs;
}

void eval_file( char* filename )
{
    FILE* fin = fopen( filename, "r" );
    if( fin==NULL ) return;
    char *outname = (char*) malloc( 1 + strlen(filename) + 6 );
    sprintf( outname, "%s.score", filename );
    FILE* fout = fopen( outname, "w" );

    char* line = NULL;
    size_t len = 0;
    ssize_t r;
    do {
        r = getline( &line, &len, fin );
        if( r >= 0 ) {
            int l = strspn( line, "AUGC" );
            if( l >= 41 ) {
                line[l] = 0;
                print_seq_bp ( line );
            }
        }
        free( line );
        line = NULL;
        len = 0;
    } while( r >= 0 );
        
    fclose( fout );
    free( outname );
    fclose( fin );
}


void do_file ( char *fname ) {
    load_file( fname );
    if( nseqs ) {
        num_seq = nseqs;
        printf( "Loaded %d sequences, %d barcode(s) are reserved.\nAllocating RAM...", num_seq, ntabu );
        printf( " done\n" );
        
        int j, k;
        for( j = 0; j < num_seq; j++ ) {
	    print_seq_bp( seqs[j] );
        }
    }
}

int main( int argc, char** argv)
{
    char *seq = 0;
    char *constrain = 0;
    double bonus = 4.86;
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
    if( argc>1 && strcmp( argv[1], "-e" )==0 ) {
        if( argc > 2 ) {
            eval_file( argv[2] );
        }
        else {
            printf( "erm... eval what?\n" );
        }
        return 0;
    }
    // print_seq_dppgm( seq, constrain );
    print_seq_aptamer( seq, constrain, bonus );
    return 0;
}

