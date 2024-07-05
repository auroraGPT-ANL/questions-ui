import {Questions} from './API';
import { Text , Flex} from '@mantine/core';

export interface QuesitonDetailViewProps {
    question: Questions
}
export function QuestionDetailView({question}: QuesitonDetailViewProps) {
    return (<>
        <h1>Source</h1>
        <Text><strong>Question ID:</strong> {question.id}</Text>
        <Text><strong>Comments:</strong> {question.comments}</Text>
        <Text><strong>Reference (ISBN/DOI/XiV):</strong> {question.doi}</Text>
        <Text><strong>Support:</strong> {question.support}</Text>
        <h1>Question</h1>
        <p>{question.question}</p>
        <h2>Correct Answer</h2>
        <ul>
            <li>{question.correct_answer}</li>
        </ul>
        <h2>Distractors</h2>
        <ul>
            {question.distractors.map((e,idx) => {
                return <li key={idx}>{e}</li>;
            })}
        </ul>
        <Flex direction="row" gap="2em">
            <div>
                <Text><strong>Domains</strong></Text>
                <ul>
                    {question.skills.map((skill, idx) => <li key={idx}>{skill}</li>)}
                </ul>
            </div>
            <div>
                <Text><strong>Skills</strong></Text>
                <ul>
                    {question.domains.map((domain, idx) => <li key={idx}>{domain}</li>)}
                </ul>
            </div>
        </Flex>
    </>);
}
