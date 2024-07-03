interface AuthorSchema {
    author: string
    affiliation: string
    position: string
    orcid?: string
}
export interface Questions {
    id?: number;
    question: string;
    correct_answer: string;
    distractors: string[];
    skills: string[];
    domains: string[];
    difficulty: string;
    doi: string;
    support: string;
    comments: string;
    author: number|AuthorSchema;
};

export const allowedDifficulties = ['Easy (basic recall and understading)', 'Medium (application and analysis)', 'Hard (evaluation, creation, and complex problem solving)'];
export const allowedPositions = ['Student', 'Early Career', 'Mid Career', 'Leader'];
export const allowedSkills = [
    'basic comprehension (i.e. retriving information using textual context clues)',
    'sumarization (i.e. condensing text while preserving semantic intent)',
    'generalization (i.e. how can concept be mapped to its more general concept)',
    'interpolation/extrapolation (i.e. fill in the middle or end of a trend/sequence)',
    'cross-domain application (i.e. how can a concept from one domain be applied elsewhere)',
    'reasoning (i.e. can be solved with pure logic without domain knowledge)',
    'general knowledge (i.e. a question suitable for the general public)',
    'fundemental domain science concepts (e.g. conservation laws, symmetries, definitions)',
    'understanding identifiers/notation (i.e. mapping an identifier to its concept/entity)',
    'understanding evolution of ideas (i.e. how do ideas/facts change over time)',
    'understanding programs (i.e. drawing conclusions from code)',
//        TODO uncomment these when we add support for imges and multi-modal question submission
//        'understanding images (i.e. drawing conclusions from a 2d image(s))',
//        'understanding tabluar data (i.e. drawing conclusions from a table(s))',
//        'understanding data (i.e. drawing conclusions from tabluar data)',
    'understanding equations (i.e. drawing conclusions from an equation)',
    'understanding units and numbers (i.e. understand relative values/units)',
    'assessing quality and uncertainty (i.e. identifying data quality issues)',
    'quantifying uncertainty (i.e. speaking in probabilistic terms about possible outcomes)',
    'contextual understanding (i.e. recognizing that a general term has different senses a domain)'
];
export const allowedDomains = ['physics', 'material science', 'biology', 'chemistry', 'computer science'];
