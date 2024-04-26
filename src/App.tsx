import { useState } from 'react';
import { MantineProvider, Container, TextInput, Text, Button, Autocomplete, MultiSelect, Flex, Textarea, em, Grid, Table} from '@mantine/core';
import { notifications, Notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import { theme } from "./theme";
import '@mantine/core/styles.css';
import classes from './HeaderSimple.module.css';

interface Result {
    model: string;
    score: number;
};

export default function App() {

  //TODO actually get the userID from GitHub/Globus OAUTH
  const [author, setAuthor] = useState("robertu94");

  return <MantineProvider theme={theme}>
    <HeaderSimple author={author}/>
    <QuestionsForm author={author} setAuthor={setAuthor} />
    <Notifications />
  </MantineProvider>;
}

export function HeaderSimple({author}) {

  return (
    <header className={classes.header}>
      <Container size="md" className={classes.inner}>
        <h1>AuroraGPT Questions</h1>
        <p>Authoring As: {author}</p>
      </Container>
    </header>
  );
}

export function QuestionsInstructions() {
        //TODO pleease ensure that this list of instructions is full and complete
        return (<div>
            <Text>Thank you for agreeing to help contribute questions to AuroraGPT! A few guidelines:</Text>
            <ul>
                <li>Your question must be a multiple choice question with only 1 correct answer.  These are the easiest to evaluate</li>
                <li>Your question should be appropriate for an first year graduate level student</li>
                <li>Your question should avoid controversial on undecided questions in your field</li>
                <li>Before you will be able to submit, you will need to test your questions against a state of the art LLM.  To test your question, please use the Test button below</li>
            </ul>
        </div>);
}
export function QuestionsForm({author, setAuthor}) {
    const authorChange = (e) => {
        console.log(e.currentTarget.value);
        setAuthor(e.currentTarget.value);
    }

    //TODO this need to be set appropriately
    const difficulties = ['undergraduate', 'graduate', 'expert'];
    const allowedSkills = ['reasoning', 'images', 'general knowledge', 'domain science'];
    const allowedDomains = ['physics', 'material science', 'biology', 'chemistry', 'computer science'];

    const [question, setQuestion] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [difficulty, setDifficulty] = useState('undergraduate');
    const [skills, setSkills] = useState<string[]>([]);
    const [domains, setDomains] = useState<string[]>([]);

    //TODO disable testing/submissions if the distractors, correct answer, question are empty
    const [distractors, setDistractors] = useState<string[]>(["", "", "", ""]);

    //TODO actually validate that the provided DOI is a real DOI
    const [doi, setDOI] = useState("");

    const [support, setSupport] = useState("");
    const [comments, setComments] = useState("");
    const [results, setResults] = useState<Result[]>([]);
    const [tested, setTested] = useState(false);

    const addDistractor = () => {
        const newDistractors = [...distractors];
        newDistractors.push("");
        setDistractors(newDistractors);
    };
    const removeDistractor = (idx) => {
        const newDistractors = [...distractors];
        newDistractors.splice(idx, 1)
        setDistractors(newDistractors);
    };
    const testQuestion = () => {
        setTested(true);
        //TODO actually test the models using the OpenAI API with the baseURL set to the selfhosted verison
        //TODO rate limit this to say 20 questions per hour to prevent abuse
        //TODO show an error message if there was a problem such as the rate limit
        setResults([{model: "lamma2", score: 100}]);
        notifications.show({title: 'testing question', message: 'please wait'});

    };
    const submitQuestion = () => {
        //TODO actually submit the qustion to the database only if this is successful
        notifications.show({title: 'submitting question', message: 'please wait'});
        //TODO only clear things if submitting the question succeeded
        setDifficulty('undergraduate');
        setQuestion('');
        setCorrectAnswer('');
        setSkills([]);
        setDomains([]);
        setResults([]);
        setDistractors(['', '','','']);
        setTested(false);
    };

    const result_rows = results.map(e => (
        <Table.Tr key={e.model}>
            <Table.Td>{e.model}</Table.Td>
            <Table.Td>{e.score}</Table.Td>
        </Table.Tr>
    ));

    return (
        <Container>
            <QuestionsInstructions />
            <Grid>
                <Grid.Col span={8}>
                <h1>Write Your Question</h1>
                <Textarea required minRows={4} label="Question" placeholder="your question" value={question} onChange={ (e) => setQuestion(e.currentTarget.value)} />
                <Textarea required minRows={4} label="Correct Answer" placeholder="the correct answer" value={correctAnswer} onChange={ (e) => setCorrectAnswer(e.currentTarget.value) }/>
                {distractors.map((value, index) => {
                    const placeholder = `incorrect choice ${index + 1}`;
                    const label = `Incorrect Answer ${index + 1}`;
                    const change = (v) => {
                        const newDistractors = [...distractors];
                        newDistractors[index] = v.currentTarget.value;
                        console.log(newDistractors);
                        setDistractors(newDistractors);
                    };
                    return (<Flex key={index} direction="row" align="center" gap="md">
                            <Textarea required w={em(512)} minRows={4} label={label}  value={value} placeholder={placeholder} onChange={change} />
                            <Button onClick={() => {removeDistractor(index);}}>X</Button>
                        </Flex>
                    );
                })}
                <Button onClick={addDistractor}>Add Incorrect Answer</Button>
                <MultiSelect required value={skills} onChange={setSkills} label="Skills" data={allowedSkills} placeholder="What skills does this require?" />
                <MultiSelect required value={domains} onChange={setDomains} label="Domains" data={allowedDomains} placeholder="What domains use this?" />
                <Autocomplete required value={difficulty} onChange={setDifficulty} label="Difficulty" data={difficulties} />
                <TextInput label="Reference DOI/ArXiV id.  You can use any paper from ArXiV or ACM from 1990-2017" placeholder="doi://" value={doi} onChange={(e) => { setDOI(e.currentTarget.value) }}/>
                <Textarea label="Support" placeholder="Supporting evidence for why the answer is correct" value={support} onChange={(e) => setSupport(e.currentTarget.value)}/>
                <Textarea label="Comments" placeholder="Optional: any other comments on the question." value={comments} onChange={(e) => setComments(e.currentTarget.value)}/>
                <TextInput required label="Author" placeholder="Author" defaultValue={author} onChange={authorChange} />
                <Button onClick={testQuestion}>Test</Button>
                <Button disabled={!tested} onClick={submitQuestion}>Submit</Button>
                </Grid.Col>
                <Grid.Col span={4}>
                    <h1>Evaluation Results</h1>

                    { results.length == 0 ? (<Text>Please click test to test your question</Text> ):
                    (<Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Model</Table.Th>
                                <Table.Th>Score</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{result_rows}</Table.Tbody>
                    </Table>)}
                </Grid.Col>
            </Grid>
        </Container>
    );
}
