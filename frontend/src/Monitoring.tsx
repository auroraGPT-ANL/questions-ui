import {useEffect, useState} from 'react';
import "@mantine/core/styles.css";
import {
  Container,
  Table
} from "@mantine/core";
import {ReviewProgressResponse, ReviewProgress} from './API';
import { HeaderSimple } from "./HeaderSimple";
export function Monitoring() {

    const [reviewProgress, setReviewProgress] = useState<ReviewProgress[]>([]);
    const [reviewersProgress, setReviewersProgress] = useState<ReviewProgress[]>([]);
    useEffect(() => { 
        const request = async () => {
            {
            const response = await fetch(
                import.meta.env.BASE_URL + "../api/reports/reviews_needed",
            )
            if(!response.ok) {
                return;
            }
            setReviewProgress(((await response.json()) as ReviewProgressResponse).values);
            }

            {
            const response = await fetch(
                import.meta.env.BASE_URL + "../api/reports/reviewers_progress",
            )
            if(!response.ok) {
                return;
            }
            setReviewersProgress(((await response.json()) as ReviewProgressResponse).values);
            }
        }
        request();
    }, [])

    return (<Container>
        <HeaderSimple title="Monitor Experiment Progress" author="" reconfigure={()=> {}}/>
        <h1>Unreviewed Questions Remaining by Domain</h1>
        <p>Please note that a question may have multiple tags, and thus appear under multiple domains</p>
        <Table>
            <Table.Thead><Table.Th>Domain</Table.Th><Table.Th>Count</Table.Th></Table.Thead>
            <Table.Tbody>
            {
                reviewProgress.map(r => (<Table.Tr key={r.key}><Table.Td>{r.key}</Table.Td><Table.Td>{r.count}</Table.Td></Table.Tr>))
            }
            </Table.Tbody>
        </Table>
        <h1>Reviews by Reviewer</h1>
        <Table>
            <Table.Thead><Table.Th>Reviewer</Table.Th><Table.Th>Count</Table.Th></Table.Thead>
            <Table.Tbody>
            {
                reviewersProgress.map(r => (<Table.Tr key={r.key}><Table.Td>{r.key}</Table.Td><Table.Td>{r.count}</Table.Td></Table.Tr>))
            }
            </Table.Tbody>
        </Table>
    </Container>);
}
