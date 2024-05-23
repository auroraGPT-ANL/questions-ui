import { ChangeEvent, useState, useMemo } from 'react';
import { MantineProvider, Container, TextInput, Text, Button, NativeSelect, MultiSelect, Flex, Textarea, em, Grid, Table, Alert, Card} from '@mantine/core';
import { notifications, Notifications } from '@mantine/notifications';
import { theme } from "./theme";
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import classes from './HeaderSimple.module.css';
import { Tooltip } from '@mantine/core';

interface Result {
    model: string;
    score: number;
    correct: boolean;
};

export default function App() {

  //TODO actually get the userID from GitHub/Globus OAUTH
  const [author, setAuthor] = useState("");

  return <MantineProvider theme={theme}>
    <HeaderSimple author={author}/>
    <QuestionsForm author={author} setAuthor={setAuthor} />
  </MantineProvider>;
}

interface HeaderProps {
    author: string
};

export function HeaderSimple({author} : HeaderProps) {

  return (
    <header className={classes.header}>
      <Container size="md" className={classes.inner}>
        <h1>AuroraGPT Question Generation Interface</h1>
        <p>Authoring As: {author}</p>
        <a href="mailto:agptquestionsform@lists.cels.anl.gov">Support</a>
      </Container>
    </header>
  );
}

export function QuestionsInstructions() {
        //TODO please ensure that this list of instructions is full and complete
        return (<div>
            <Text>Thank you for agreeing to help contribute questions to AuroraGPT Project! A few guidelines:</Text>
            <ul>
                <li>By contributing your questions here, you agree the data you submit in this form may be used for evaluation of AuroraGPT and other tasks as needed, and you are allowed to make these contributions.</li>
                <li>In the near future, Globus Authentication will be required to submit and test your questions.  This is primarily to prevent spam.</li>
                <li>Your question must be based on a research paper published in one of the following databases or repositories: OSTI, peS20, ArXiV, Dolma, RP1, BioXiV, ChemXiv, MedXiV, PubMed Central, NIH Lit Archive, or ACM (from the years 1990 to 2017). Please be prepared to provide the DOI or XiV ID of the paper as a reference when submitting your question.</li>
                <li>Your question must be a multiple choice question with only 1 correct answer.  These are the easiest to evaluate.</li>
                <li>Your question should be appropriate for a first year graduate-level student</li>
                <li>Your question should avoid controversial or undecided questions in your field</li>
                <li>Your question should avoid calculations; this is an area where current LLMs struggle, and will be assessed separately</li>
                <li>For now avoid questions that require interpretation of figures or tables as our ability extract these is limited</li>
                <li>Before you will be able to submit, you will need to test your questions against various LLMs using the Test feature below.  <strong>Please avoid using 3rd party LLMs or other systems to test your question to avoid benchmark leakage</strong></li>
                <li>Your answer to question should be addressed unambiguously in a published paper</li>
            </ul>
        </div>);
}

interface ValidationFeedbackProps {
    reasons: string[];
};
export function ValidationFeedback({reasons}: ValidationFeedbackProps) {
    if (reasons.length === 0) return <></>;

    return <Alert variant="light" color="orange" title="Please fix these before testing" icon="&#9888;">
            <ul>
                {reasons.map((x) => <li key={x}>{x}</li>)}
            </ul>
        </Alert>;
}

interface QuestionsFormProps {
    author: string;
    setAuthor: (author: string) => void;
};
export function QuestionsForm({author, setAuthor}: QuestionsFormProps) {
    const authorChange = (e: ChangeEvent<HTMLInputElement>) => {
        setAuthor(e.currentTarget.value);
    }

    const difficulties = ['Easy (basic recall and understading)', 'Medium (application and analysis)', 'Hard (evaluation, creation, and complex problem solving)'];
    const allowedSkills = [
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
    const allowedDomains = ['physics', 'material science', 'biology', 'chemistry', 'computer science'];

    const [edited, setEdited] = useState(false);
    const [question, setQuestionImpl] = useState('');
    const setQuestion = (value: string) => {
        setEdited(true);
        setQuestionImpl(value);
    };
    const [correctAnswer, setCorrectAnswerImpl] = useState('');
    const setCorrectAnswer = (value: string) => {
        setEdited(true);
        setCorrectAnswerImpl(value);
    };
    const [difficulty, setDifficultyImpl] = useState(difficulties[0]);
    const setDifficulty = (value: string) => {
        setEdited(true);
        setDifficultyImpl(value);
    };
    const [skills, setSkillsImpl] = useState<string[]>([]);
    const setSkills = (value: string[]) => {
        setEdited(true);
        setSkillsImpl(value);
    };
    const [domains, setDomainsImpl] = useState<string[]>([]);
    const setDomains = (value: string[]) => {
        setEdited(true);
        setDomainsImpl(value);
    };

    const [distractors, setDistractorsImpl] = useState<string[]>(["", "", "", ""]);
    const setDistractors = (value: string[]) => {
        setEdited(true);
        setDistractorsImpl(value);
    };

    const [doi, setDOIImpl] = useState("");
    const setDOI = (value: string) => {
        setEdited(true);
        setDOIImpl(value);
    };

    const [support, setSupportImpl] = useState("");
    const setSupport = (value: string) => {
        setEdited(true);
        setSupportImpl(value);
        
    }
    const [comments, setCommentsImpl] = useState("");
    const setComments = (value: string) => {
        setEdited(true);
        setCommentsImpl(value);
        
    }
    const [results, setResults] = useState<Result[]>([]);
    const [tested, setTested] = useState(false);

    const addDistractor = () => {
        const newDistractors = [...distractors];
        newDistractors.push("");
        setDistractors(newDistractors);
    };
    const removeDistractor = (idx: number) => {
        const newDistractors = [...distractors];
        newDistractors.splice(idx, 1)
        setDistractors(newDistractors);
    };
    const [submittingDisabled, disabledReasons] = useMemo(() => {
        let disabled = false;
        let reasons = [];
        if (question.length === 0) {
            disabled = disabled || true;
            reasons.push("the question must be non-empty");
        }
        if (correctAnswer.length === 0) {
            disabled = disabled || true;
            reasons.push("the correct answer must be non-empty");
        }
        if (!distractors.every((x) => x.length > 0)) {
            disabled = disabled || true;
            reasons.push("all distractors must be non-empty");
        }
        const choices = new Set(distractors);
        choices.add(correctAnswer);
        if (choices.size !== (distractors.length + 1)) {
            disabled = disabled || true;
            reasons.push("all choices (distractors+correct answer) must be unique");
        }
        if (skills.length < 1) {
            disabled = disabled || true;
            reasons.push("at least one skill is required");
        }
        if (doi.length < 1) {
            disabled = disabled || true;
            reasons.push("A reference DOI or XiV id is required");
        }
        if (author.length === 0) {
            disabled = disabled || true;
            reasons.push("Author is required");
        }
        return [disabled, reasons];
    }, [distractors, correctAnswer, question, skills, difficulty, doi, author]);

    const testQuestion = async () => {
        const testing = notifications.show({title: 'testing question', message: 'please wait upto 5 minutes for cold starts', autoClose: false});
        try {
            const response = await fetch(import.meta.env.BASE_URL + '../api/test_question', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(
                    {
                        question: question,
                        correct_answer: correctAnswer,
                        distractors: distractors,
                        skills: skills,
                        domains: domains,
                        difficulty: difficulty,
                        doi: doi,
                        support: support,
                        comments: comments,
                        author: author,
                    }
                )
            });
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            const eval_results = await response.json();
            setResults(eval_results);

            notifications.hide(testing);
            notifications.show({title: 'testing completed', message: `completed testing your question: ${question}`});
            setTested(true);

        } catch (error) {
            notifications.hide(testing);
            notifications.show({title: 'testing failed', message: `failed submitting your question: ${error}`});
        }

    };
    const submitQuestion = async () => {
        const submitting = notifications.show({title: 'submitting question', message: 'please wait', autoClose: false});
        try {
            const response = await fetch(import.meta.env.BASE_URL + '../api/question', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(
                    {
                        question: question,
                        correct_answer: correctAnswer,
                        distractors: distractors,
                        skills: skills,
                        domains: domains,
                        difficulty: difficulty,
                        doi: doi,
                        support: support,
                        comments: comments,
                        author: author,
                    }
                )
            });
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            notifications.hide(submitting);
            notifications.show({title: 'submitted question', message: `successfully submitted your question: ${question}`, autoClose: 10000});

            setQuestion('');
            setCorrectAnswer('');
            setDistractors(['', '','','']);
            setDOI('');
            setComments('')
            setSupport('')
            setResults([]);
            setSkills([]);
            setDomains([]);
            setDifficulty(difficulties[0]);
            setTested(false);
            setEdited(false);
            }
        catch (error) {
            notifications.hide(submitting);
            notifications.show({title: 'submitting failed', message: `failed submitting your question: ${error}`});
        }
    };

    const result_rows = results.map(e => (
        <Table.Tr key={e.model}>
            <Table.Td>{e.model}</Table.Td>
            <Table.Td>{e.score}</Table.Td>
            <Table.Td>{e.correct.toString()}</Table.Td>
        </Table.Tr>
    ));

    return (
        <Container>
            <QuestionsInstructions />
            <Grid>
                <Grid.Col span={12}>
                <h1>Write Your Question</h1>
                <Textarea required minRows={4} label="Question" placeholder="your question" value={question} onChange={ (e) => setQuestion(e.currentTarget.value)} />
                <Textarea required minRows={4} label="Correct Answer" placeholder="the correct answer" value={correctAnswer} onChange={ (e) => setCorrectAnswer(e.currentTarget.value) }/>
                {distractors.map((value, index) => {
                    const placeholder = `incorrect choice ${index + 1}`;
                    const label = `Incorrect Answer ${index + 1}`;
                    const change = (v: ChangeEvent<HTMLTextAreaElement>) => {
                        const newDistractors = [...distractors];
                        newDistractors[index] = v.currentTarget.value;
                        setDistractors(newDistractors);
                    };
                    return (<Flex key={index} direction="row" align="center" gap="md">
                            <Textarea required w={em(512)} minRows={4} label={label}  value={value} placeholder={placeholder} onChange={change} />
                            <Button onClick={() => {removeDistractor(index);}}>X</Button>
                        </Flex>
                    );
                })}
                <Button onClick={addDistractor}>Add Incorrect Answer</Button>
                <MultiSelect required value={skills} onChange={setSkills} label="Skills" data={allowedSkills} searchable placeholder="What skills does this require?" />
                <MultiSelect required value={domains} onChange={setDomains} label="Domains" data={allowedDomains} searchable placeholder="What domains use this?" />
                <NativeSelect required value={difficulty} onChange={(e) => setDifficulty(e.currentTarget.value)} label="Difficulty" data={difficulties} />
                <TextInput required label="Reference DOI/XiV id.  You can use any paper from OSTI, peS20, ArXiV, Dolma, RP1, BioXiV, ChemXiv, MedXiV, PubMed Central, and NIH Lit Archive, and ACM from 1990-2017" placeholder="doi://" value={doi} onChange={(e) => { setDOI(e.currentTarget.value) }}/>
                <Textarea label="Support" placeholder="Supporting evidence for why the answer is correct" value={support} onChange={(e) => setSupport(e.currentTarget.value)}/>
                <Textarea label="Comments" placeholder="Optional: any other comments on the question." value={comments} onChange={(e) => setComments(e.currentTarget.value)}/>
                <TextInput required label="Author" placeholder="Author" defaultValue={author} onChange={authorChange} />

                { edited ? <ValidationFeedback reasons={disabledReasons} /> : <></> }
                {
                    (results.length == 0) ? 
                    <Card shadow="sm" p="lg" radius="md" withBorder>
                        <Text size="sm">ℹ️ Please click <strong>Test</strong> to test your question</Text>
                        <Text size="sm">ℹ️ You will get the results instantaneously in most cases, but you may occasionally need to wait for upto 5 minutes for a cold start.</Text>
                    </Card>: <></>
                }
                <Notifications position="bottom-center" />
                <Button disabled={submittingDisabled} onClick={testQuestion}>Test</Button>
                <Button disabled={(!tested || submittingDisabled)} onClick={submitQuestion}>Submit</Button>
                </Grid.Col>
            </Grid>
            
            { results.length == 0 ? <></>:
            <Grid>
                <Grid.Col span={12}>
                    <h1>Evaluation Results</h1>
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Model</Table.Th>
                                <Table.Th>
                                    <Tooltip
                                        label="The score is the probability of the model generating the correct answer."
                                    >
                                        <span style={{ cursor: 'default', display: 'inline-flex', alignItems: 'center' }}>
                                            Score <span style={{ marginLeft: '4px' }}>ℹ️</span>
                                        </span>
                                    </Tooltip>
                                </Table.Th>
                                <Table.Th>
                                    <Tooltip
                                        label="Whether the model selects the correct answer."
                                    >
                                        <span style={{ cursor: 'default', display: 'inline-flex', alignItems: 'center' }}>
                                            Correct <span style={{ marginLeft: '4px' }}>ℹ️</span>
                                        </span>
                                    </Tooltip>
                                </Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{result_rows}</Table.Tbody>
                    </Table>
                </Grid.Col>
            </Grid>
            }
            
        </Container>
    );
}
