import { ChangeEvent, useState, useMemo } from 'react';
import { MantineProvider, Container, TextInput, Text, Button, NativeSelect, MultiSelect, Flex, Textarea, em, Grid, Table, Alert, Card, Switch, Group, Collapse } from '@mantine/core';
import { notifications, Notifications } from '@mantine/notifications';
import { theme } from "./theme";
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import classes from './HeaderSimple.module.css';
import { Tooltip } from '@mantine/core';
import WhyContribute from "./WhyContribute";
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';


function DropdownButton() {
  const [opened, setOpened] = useState(false);

  const toggleOpen = () => {
    setOpened((prev) => !prev);
  };

  return (
    <div>
      <Text
        style={{
          cursor: 'pointer',
          fontStyle: 'italic',
          fontWeight: 'bold',
          color: 'black',
        }}
        onClick={toggleOpen}
      >
        {opened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />} Why contribute?
      </Text>
      <Collapse in={opened}>
        <WhyContribute />
        <Text
          style={{
            cursor: 'pointer',
            fontStyle: 'italic',
            fontWeight: 'bold',
            color: 'black',
            marginTop: '1rem',
          }}
          onClick={toggleOpen}
        >
           <IconChevronUp size={16} /> Close
        </Text>
      </Collapse>
    </div>
  );
}


interface Result {
    model: string;
    score: number;
    correct: boolean;
    corectlogprobs: string;
    incorrectlogprobs: string;
};

export default function App() {

  //TODO actually get the userID from GitHub/Globus OAUTH
  const [author, setAuthor] = useState("");
  return (
    <MantineProvider theme={theme}>

        <HeaderSimple author={author} />
        <QuestionsForm author={author} setAuthor={setAuthor} />
    </MantineProvider>
  );
}

interface HeaderProps {
    author: string
};

export function HeaderSimple({author} : HeaderProps) {

  return (
    <header className={classes.header}>
      <Container size="md" className={classes.inner}>
        <h1>AI4Science Benchmark Question Generation</h1>
        <p>Authoring As: {author}</p>
        <a href="mailto:agptquestionsform@lists.cels.anl.gov">Support</a>
      </Container>
    </header>
  );
}

export function QuestionsInstructions() {
        //TODO please ensure that this list of instructions is full and complete
        return (<div>
            <DropdownButton />
            <Text style={{
                paddingTop: '20px', 
            }}>
                Thank you for agreeing to help contribute questions to AI4Science benchmark! A few guidelines:
            </Text>
            <ul>
                <li>By contributing your questions here, you agree the data you submit in this form may be used for evaluation of AI models and other tasks as needed, and you are allowed to make these contributions.</li>
                <li>In the near future, Globus Authentication will be required to submit and test your questions.  This is primarily to prevent spam.</li>
                <li>Your answer to the question should be referenced with a published paper or a scientific textbook. Please be prepared to provide the DOI or XiV ID of the paper or the ISBN of the book as a reference when submitting your question.</li>
                <li>Your question must be a multiple-choice question with only 1 correct answer. These are the easiest to evaluate.</li>
                <li>Your question should be appropriate for a first-year graduate-level student.</li>
                <li>Your question should avoid controversial or undecided questions in your field.</li>
                <li>Your question should avoid calculations; this is an area where current LLMs struggle, and will be assessed separately.</li>
                <li>For now avoid questions that require interpretation of figures or tables as our ability to extract these is limited.</li>
                <li>Before you will be able to submit, you will need to test your questions against various LLMs using the Test feature below. <strong>Please avoid using 3rd party LLMs or other systems to test your question to avoid benchmark leakage</strong>.</li>
                <li>Your answer to the question should be addressed unambiguously in a published paper.</li>
                
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
    const allowedPositions = ['Student', 'Early Career', 'Mid Career', 'Leader'];
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
    const [difficulty, setDifficultyImpl] = useState('');
    const setDifficulty = (value: string) => {
        setEdited(true);
        setDifficultyImpl(value);
    };
    const [position, setPositionImpl] = useState('');
    const setPosition = (value: string) => {
        setEdited(true);
        setPositionImpl(value);
        console.log(value);
    };
    const [affiliation, setAffiliationImpl] = useState('');
    const setAffiliation = (value: string) => {
        setEdited(true);
        setAffiliationImpl(value);
        console.log(value);
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

    const [showlogprob, setShowlogprobImpl] = useState(false);
    const setShowlogprob = (event: any) => {
        setShowlogprobImpl(event.currentTarget.checked);
        console.log(event.currentTarget.checked);
    };

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
        if (difficulty.length === 0) {
            disabled = disabled || true;
            reasons.push("Difficulty is required");
        }
        if (doi.length < 1) {
            disabled = disabled || true;
            reasons.push("A reference ISBN, DOI, or XiV ID is required");
        }
        if (author.length === 0) {
            disabled = disabled || true;
            reasons.push("Author is required");
        }
        if (affiliation.length === 0) {
            disabled = disabled || true;
            reasons.push("Affiliation is required");
        }
        if (position.length === 0) {
            disabled = disabled || true;
            reasons.push("Position is required");
        }
        return [disabled, reasons];
    }, [distractors, correctAnswer, question, skills, difficulty, doi, author, affiliation, position]);

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
                        affiliation: affiliation,
                        position: position
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
                        affiliation: affiliation,
                        position: position
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
            setDifficulty('');
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

    const result_rows_full = results.map(e => (
        <Table.Tr key={e.model}>
            <Table.Td>{e.model}</Table.Td>
            <Table.Td>{e.score}</Table.Td>
            <Table.Td>{e.correct.toString()}</Table.Td>
            <Table.Td>{e.corectlogprobs}</Table.Td>
            <Table.Td>{e.incorrectlogprobs}</Table.Td>
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
                <NativeSelect
                    required
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.currentTarget.value)}
                    label="Difficulty"
                    data={
                        difficulty ? 
                        difficulties.map(diff => ({ value: diff, label: diff })) : 
                        [
                            { value: '', label: 'Select difficulty', disabled: true }, 
                            ...difficulties.map(diff => ({ value: diff, label: diff }))
                        ]
                    }
                    styles={() => ({
                        input: {
                          color: difficulty ? 'black' : 'rgb(173, 181, 189)',
                          '&:not(:focus):invalid': {
                            color: 'rgb(173, 181, 189)' 
                          }
                        },
                        item: {
                          '&[data-disabled]': {
                            color: 'rgb(173, 181, 189)', 
                          },
                          '&:not([data-disabled])': {
                            color: 'black',
                          }
                        }
                    })}
                />
                <TextInput required label="Reference ISBN, DOI, or XiV ID" placeholder="doi://" value={doi} onChange={(e) => { setDOI(e.currentTarget.value) }}/>
                <Textarea label="Support" placeholder="Supporting evidence for why the answer is correct" value={support} onChange={(e) => setSupport(e.currentTarget.value)}/>
                <Textarea label="Comments" placeholder="Optional: any other comments on the question." value={comments} onChange={(e) => setComments(e.currentTarget.value)}/>
                <TextInput required label="Author" placeholder="Author" defaultValue={author} onChange={authorChange} />
                <TextInput required label="Affiliation" placeholder="Affiliation" value={affiliation} onChange={(e) => setAffiliation(e.currentTarget.value)}/>
    
                <NativeSelect
                    required
                    value={position}
                    onChange={(e) => setPosition(e.currentTarget.value)}
                    label="Position"
                    data={
                        position ? 
                        allowedPositions.map(pos => ({ value: pos, label: pos })) : 
                        [
                            { value: '', label: 'Select position', disabled: true }, 
                            ...allowedPositions.map(pos => ({ value: pos, label: pos }))
                        ]
                    }
                    styles={() => ({
                        input: {
                          color: position ? 'black' : 'rgb(173, 181, 189)',
                          '&:not(:focus):invalid': {
                            color: 'rgb(173, 181, 189)' 
                          }
                        },
                        item: {
                          '&[data-disabled]': {
                            color: 'rgb(173, 181, 189)', 
                          },
                          '&:not([data-disabled])': {
                            color: 'black',
                          }
                        }
                    })}
                />

                { edited ? <ValidationFeedback reasons={disabledReasons} /> : <></> }
                {
                    (results.length == 0) ? 
                    <Card shadow="sm" p="lg" radius="md" withBorder>
                        <Text size="sm">ℹ️ The collected personnel information will be stored in the database storing the MCQs. This information will be accessible only to researchers involved in AI4Science benchmark. It will be used to perform statistics.</Text>
                        <Text size="sm">ℹ️ Please click <strong>Test</strong> to test your question.</Text>
                        <Text size="sm">ℹ️ You will get the results instantaneously in most cases, but you may occasionally need to wait for upto 5 minutes for a cold start.</Text>
                        <Text size="sm">ℹ️ Please click <strong>Submit</strong> after you <strong>Test</strong> your question and believe your question is ready for submission.</Text>
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
                    <Group justify="right" p="md">
                        <Switch
                            checked={showlogprob}
                            onChange={setShowlogprob}
                            size="sm" 
                            color="blue" 
                            label="Show Log Probabilities"
                        />
                    </Group>
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
                                {
                                    showlogprob ? 
                                    <Table.Th>
                                        <Tooltip
                                            label="Average log probability of the tokens in the correct answer."
                                        >
                                            <span style={{ cursor: 'default', display: 'inline-flex', alignItems: 'center' }}>
                                            Correct Log Prob <span style={{ marginLeft: '4px' }}>ℹ️</span>
                                            </span>
                                        </Tooltip>
                                    </Table.Th>
                                    : <></>
                                }
                                {
                                    showlogprob ? 
                                    <Table.Th>
                                        <Tooltip
                                            label="Average log probability of the tokens in the incorrect answer."
                                        >
                                            <span style={{ cursor: 'default', display: 'inline-flex', alignItems: 'center' }}>
                                            Incorrect Log Prob <span style={{ marginLeft: '4px' }}>ℹ️</span>
                                            </span>
                                        </Tooltip>
                                    </Table.Th>
                                    : <></>
                                }
                            </Table.Tr>
                        </Table.Thead>
                        {
                            showlogprob ? <Table.Tbody>{result_rows_full}</Table.Tbody> :
                            <Table.Tbody>{result_rows}</Table.Tbody>
                        }
                    </Table>
                </Grid.Col>
            </Grid>
            }
            
        </Container>
    );
}
