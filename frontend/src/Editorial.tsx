import "@mantine/core/styles.css";
import { useState, useEffect } from 'react';
import {
  Container,
  TextInput,
  Table,
  Button,
  Select,
  TagsInput,
  Text,
  List,
  Collapse,
  Checkbox,
} from "@mantine/core";
import { HeaderSimple } from "./HeaderSimple";
import {Questions, AuthorResponseSchema, Domain} from './API.tsx';
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";

async function parse_domains(search: string) : Promise<[number[], string]> {
    const domain_regex = /domain:(?:"([^"]*)"|(\S)+)/g;
    const domain_ids: number[] = [];
    let domain_names_match: RegExpExecArray|null;
    while((domain_names_match = domain_regex.exec(search)) !== null) {
        const name = domain_names_match[1] || domain_names_match[2];
        const domain_id_response = await fetch(
            import.meta.env.BASE_URL + `../api/domain?name=${name}`,
                {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );
        domain_id_response.ok
        const domain_id: Domain[] = await domain_id_response.json()
        domain_ids.push(...domain_id.map(i => i.id));
    }
    return [domain_ids, search.replace(domain_regex, "").trim()];
}
async function parse_authors(search: string): Promise<[number[], string]> {
    const author_regex = /author:(?:"([^"]*)"|(\S)+)/g;
    const author_ids: number[] = [];
    let author_names_match: RegExpExecArray|null;
    while((author_names_match = author_regex.exec(search)) !== null) {
        const name = author_names_match[1] || author_names_match[2];
        const author_id_response = await fetch(
            import.meta.env.BASE_URL + `../api/author?name=${name}`,
                {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );
        author_id_response.ok;
        const author_id: AuthorResponseSchema[] = await author_id_response.json();
        author_ids.push(...author_id.map(i => i.id));
    }
    return [author_ids, search.replace(author_regex, "").trim()];
}
async function parse_validated(search: string): Promise<[boolean|null, string]> {
    const validated_regex = /validated:((\S)+)/g;
    let match: RegExpExecArray|null;
    let skip_validated: boolean|null = null;
    while((match = validated_regex.exec(search)) !== null) {
        if (match[1] === "true") {
            skip_validated = true;
        } else if (match[1] === "false") {
            skip_validated = false;
        }
    }
    return [skip_validated, search.replace(validated_regex, "").trim()];
}

export function Editorial() {
    const [questions, setQuestions] = useState<Questions[]>([]);
    const [search, setSearch] = useState("");
    const [offset, setOffset] = useState(0);
    const [limit, setLimit] = useState(10);
    const [domains, setDomains] = useState<string[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [availableDomains, setAvailableDomains] = useState<string[]>([]);
    const saveDomains = (e: any) => {
        setDomains(e);
    };
    useEffect(() => {
        let retrieveDomains = async () => {
            const domains_request = await fetch(
                import.meta.env.BASE_URL + `../api/domain`,
                    {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
            const available_domains: Domain[] = await domains_request.json();
            setAvailableDomains(available_domains.map(i => i.name));
        }
        retrieveDomains();
    }, []);
    useEffect(() => {
        let retrieve = async () => {
            const [domain_ids, d_query]  = await parse_domains(search);
            const [author_ids, a_query]  = await parse_authors(d_query);
            const [skip_validated, query_str]  = await parse_validated(a_query);

            const author_query = author_ids.map(i => `&author_ids=${i}`).join('');
            const domains_query = domain_ids.map(i => `&domain=${i}`).join('');
            const validated_query = skip_validated === true? "&validated=true" :
                                    skip_validated === false? "&validated=false" :
                                    "";
            const questions_response = await fetch(
                import.meta.env.BASE_URL + `../api/question?skip=${offset}&limit=${limit}&q=${query_str}${domains_query}${author_query}${validated_query}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );
            if (!questions_response.ok) {
                throw new Error(questions_response.statusText);
            }
            const review_questions: Questions[] = await questions_response.json();
            setQuestions(review_questions);
        };
        retrieve();
    }, [search, offset, limit])
    const body = questions.map((q) => 
        <Table.Tr key={q.id}
            bg={selected.includes(q.id!) ? 'var(--mantine-color-blue-light)' : undefined}
            >
            <Table.Td>
                <Checkbox
                    aria-label="select row"
                    checked={selected.includes(q.id!)}
                    onChange={(e) =>
                        setSelected(
                            e.currentTarget.checked ?
                                [...selected, q.id!] :
                                selected.filter(p => p !== q.id!)
                        )
                    }
                    />
            </Table.Td>
            <Table.Td>{q.id}</Table.Td>
            <Table.Td>{q.question}</Table.Td>
        </Table.Tr>
    )
    const submitChanges = async () => {
        for (const q of selected) {
            const base_question_response = await fetch(
                import.meta.env.BASE_URL + `../api/question/${q}`,
                    {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    }
                },
            );
            const base_question: Questions = await base_question_response.json();
            const s = new Set([...base_question.domains, ...domains]);
            base_question.domains = [...s];
            
            const update_question_response = await fetch(
                import.meta.env.BASE_URL + `../api/question/${q}`,
                    {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(base_question)
                },
            );
            if(!update_question_response.ok) {
                console.log("update question failed: ", update_question_response.statusText)
            }
        }
    }
    return (<>
        <HeaderSimple title="Editorial Review" author="" reconfigure={()=> {}}/>
        <Container>
            <h1>Search</h1>

            <SearchHelp />
            <TextInput label="Search" value={search} onChange={(e) => setSearch(e.currentTarget.value)}/>
            <Select label="results per page" value={`${limit}`} data={["10", "30", "100"]} onChange={(e) => setLimit(e ? parseInt(e) : 10)}/>
            <h1>Results</h1>
            <Table stickyHeader >
                <Table.Thead>
                    <Table.Th />
                    <Table.Th>Id</Table.Th>
                    <Table.Th>Question</Table.Th>
                </Table.Thead>
                <Table.Tbody>
                {body}
                </Table.Tbody>
            </Table>
            
            <Button disabled={offset == 0} onClick={() => setOffset(o => Math.max(0, o - limit)) } >Previous</Button>
            <Button disabled={questions.length != limit} onClick={() => setOffset(o => o + limit) } >Next</Button>
            <br/>

          <h1>Batch Changes</h1>
          <Text>Currently {selected.length} entries are selected</Text><Button onClick={() => {setSelected([])} }>Clear Selection</Button>
          <TagsInput
            value={domains}
            onChange={saveDomains}
            label="Add domains to selected quesions.  You can make up new tags here by typing them then hitting 'enter' or 'tab'"
            data={availableDomains}
            placeholder="What domains use this?"
            clearable
          />
            
            <Button onClick={submitChanges}>Submit Changes</Button>
        </Container>
    </>);
}

function SearchHelp() {
    const [opened, setOpened] = useState(false);
    const toggleOpened = () => {setOpened(o => !o) };
    return (
            <div>
            <Text onClick={toggleOpened}>Search Help {opened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}{" "}
</Text>
            <Collapse in={opened}>
            <p>
                The search box can search the text of any question.  You can also the following
                specialized search commands

                <List>
                    <List.Item><strong>domain:"Name"</strong> to search for questions with a specific domain tag.  This tag can be repeated</List.Item>
                    <List.Item><strong>author:"Name"</strong> to search for questions by a specific author</List.Item>
                    <List.Item><strong>validated:true</strong> restrict query to validated or not yet validated questions</List.Item>
                </List>

            </p>
            </Collapse>
            </div>
    );
}
