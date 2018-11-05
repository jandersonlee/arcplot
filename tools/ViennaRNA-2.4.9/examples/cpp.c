// cpp.c: constrained pairing probabilities

#include <stdlib.h>
#include <stdio.h>
#include <string.h>

#include <ViennaRNA/fold.h>
#include <ViennaRNA/fold_compound.h>
#include <ViennaRNA/utils/basic.h>
#include <ViennaRNA/equilibrium_probs.h>
#include <ViennaRNA/constraints/basic.h>

static int
add_ligand_motif(vrna_fold_compound_t *vc,
                 char                 *motif,
                 unsigned int         options)
{
  int   r, l, error=0;
  char  *seq, *str, *ptr;
  float energy;
  l   = strlen(motif);
  seq = vrna_alloc(sizeof(char) * (l + 1));
  str = vrna_alloc(sizeof(char) * (l + 1));
  error = 1;
  if (motif) {
    error = 0;
    /* parse sequence */
    for (r = 0, ptr = motif; *ptr != '\0'; ptr++) {
      if (*ptr == ',') break;
      seq[r++] = (*ptr=='_' ? '&' : *ptr);
    }
    seq[r]  = '\0';
    seq     = vrna_realloc(seq, sizeof(char) * (strlen(seq) + 1));
    for (ptr++, r = 0; *ptr != '\0'; ptr++) {
      if (*ptr == ',' || !*ptr) break;
      str[r++] = (*ptr=='_' ? '&' : *ptr);
    }
    str[r]  = '\0';
    str     = vrna_realloc(str, sizeof(char) * (strlen(str) + 1));
    if (*ptr) {
      ptr++;
      if (!(sscanf(ptr, "%f", &energy) == 1)) {
        //vrna_message_warning("Energy contribution in ligand motif missing!");
        error = 1;
      }
    } else energy = -4.86;
    if (strlen(seq) != strlen(str)) {
      //vrna_message_warning("Sequence and structure length in ligand motif have unequal lengths!");
      error = 1;
    }
    if (strlen(seq) == 0) {
      vrna_message_warning("Sequence length in ligand motif is zero!");
      error = 1;
    }
  }
  if (error || (!vrna_sc_add_hi_motif(vc, seq, str, energy, options)))
    //vrna_message_warning("Malformatted ligand motif! Skipping stabilizing motif.");
  free(seq);
  free(str);
  return error;
}

//{'fmn_GC', 'GAGGAUAU&AGAAGGC,(......(&).....),-4.86'},
//{'fmn_CG', 'CAGGAUAU&AGAAGGG,(......(&).....),-4.86'},
//{'theo', 'GAUACCAG&CCCUUGGCAGC,(...((((&)...)))...),-4.00'}

int
main(int argc, char **argv)
{
  /* The RNA sequence */
  char *seq = (argc>1?argv[1]:"AGCGAAAGCA");
  char *theo1  = "GAUACCAG&CCCUUGGCAGC,(...((((&)...)))...),-4.00";
  char *motif= (argc>2?argv[2]:theo1);

  /* initialize the model */
  vrna_md_t md[1];
  vrna_md_set_default(md);
  unsigned int options = VRNA_OPTION_MFE | VRNA_OPTION_PF;
  vrna_fold_compound_t* fc = vrna_fold_compound (seq, md, options);

  /* predict Minmum Free Energy and corresponding secondary structure */
  /* allocate memory for MFE structure (length + 1) */
  char  *shape = (char *)vrna_alloc(sizeof(char) * (strlen(seq) + 1));
  shape[0] = 0;
  float mfe = vrna_fold(seq, shape);

  /* compute the pairing probabilities */
  vrna_pf (fc, NULL ); 	
  /* Compute the equilibrium probability of a particular secondary structure */
  double prob = vrna_pr_structure(fc, shape); 	

  /* print sequence, structure and MFE */
  printf("%s %s\n%s %6.2f %8.6f\n", seq, motif, shape, mfe, prob);

  /* print all base pairs with probability above 0.0001% */
  vrna_ep_t *ptr, *plis1 = vrna_plist_from_probs(fc, 0.000001);

  /* cleanup memory */
  free(shape);
  vrna_fold_compound_free(fc);

  //char *con = "..........((((xxxx)))).....";
  //char  *aseq = "CUAGCAACCUAG";
  //char  *ashp = "((((....))))";
  //double bonus = -4.86;
  vrna_md_set_default(md);
  options = VRNA_OPTION_MFE | VRNA_OPTION_PF;
  fc = vrna_fold_compound (seq, md, options);
  add_ligand_motif(fc, motif, options);
  //vrna_sc_add_hi_motif(fc, aseq, ashp, bonus, options);

  /* predict Minmum Free Energy and corresponding secondary structure */
  /* allocate memory for MFE structure (length + 1) */
  shape = (char *)vrna_alloc(sizeof(char) * (strlen(seq) + 1));
  shape[0] = 0;
  mfe = vrna_mfe(fc, shape);

  /* compute the pairing probabilities */
  vrna_pf (fc, NULL ); 	
  /* Compute the equilibrium probability of a particular secondary structure */
  prob = vrna_pr_structure(fc, shape); 	

  /* print ns2 and me2 */
  printf("%s %6.2f %8.6f\n", shape, mfe, prob);

  /* print all base pairs with probability above 0.0001% */
  vrna_ep_t *plis2 = vrna_plist_from_probs(fc, 0.000001);
  for (ptr = plis1; ptr->i!=0 || ptr->j!=0; ptr++)
    if (ptr->p >= 0.000001)
      printf("%d %d %8.6f\n", ptr->i, ptr->j, ptr->p);
  for (ptr = plis2; ptr->i!=0 || ptr->j!=0; ptr++)
    if (ptr->p >= 0.000001)
      printf("%d %d %8.6f\n", ptr->j, ptr->i, ptr->p);
  free(plis1);
  free(plis2);

  /* cleanup memory */
  free(shape);
  //vrna_fold_compound_free(fc);

  return 0;
}
