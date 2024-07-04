import { Container, Grid, Button, Group, Textarea, Slider, Text , Flex, MultiSelect, TextInput , NativeSelect } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { notifications, Notifications } from '@mantine/notifications';
import { useState, useMemo, useRef, useEffect } from 'react';
import classes from './HeaderSimple.module.css';
import {Questions, allowedDomains, allowedPositions} from './API';

interface HeaderProps {
    author: string,
    reconfigure: () => void;
};
function HeaderSimple({author, reconfigure} : HeaderProps) {

  return (
    <header className={classes.header}>
      <Container size="md" className={classes.inner}>
        <h1>AI4Science Reviewing</h1>
        <p>Authoring As: {author}</p>
        <Button onClick={() => reconfigure() }>Change Reviewer</Button>
        <a href="mailto:agptquestionsform@lists.cels.anl.gov">Support</a>
      </Container>
    </header>
  );
}

enum ReviewAction {
approved,
skipped,
rejected
}
function formatReviewAction(r: ReviewAction|boolean) : string {
    switch(r) {
        case ReviewAction.approved:
            return "✓"
        case ReviewAction.rejected:
            return "✕"
        case ReviewAction.skipped:
           return "=>"
        case true: 
            return "✓"
        case false:
            return "✕"
    }
}
interface History {
    id: number;
    question: string;
    action: ReviewAction|boolean;
}
interface ProgressProps {
    project: string
    sofar: number;
    goal: number;
    history: History[];
    to_review: number[]
}
function ProgressTrackerUI({project, sofar, history, goal}: ProgressProps) {
    const marks = [
    {value: 0, label:""},
    {value: goal, label: `Gloal ${goal}`},
    ];
    return (<>
        <h1>Project</h1>
        <p>{project}</p>
        <h1>Progress</h1>
        {(goal == 0) ? 
            <Text>Nothing to do</Text>:
            <Slider min={0} max={goal} value={sofar} marks={marks} disabled />
        }
        <h1>Recent Reviews</h1>
        {(history.length !== 0) ? 
        <ul>
            {history.map((h) => <li key={h.id}>{formatReviewAction(h.action)} {h.id}: {h.question.substring(0, 100) + (h.question.length > 100 ? "…" : "")}</li>)}
        </ul>:
        <Text>You haven't reviewed yet</Text>
        }
        
    </>);
}

interface QuesitonDetailViewProps {
    question: Questions
}
function QuestionDetailView({question}: QuesitonDetailViewProps) {
    return (<>
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
        <h2>Metadata</h2>
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
        <Text><strong>Comments:</strong> {question.comments}</Text>
        <Text><strong>DOI:</strong> {question.doi}</Text>
        <Text><strong>Support:</strong> {question.support}</Text>
    </>);
}
interface FeedbackProps {
    id: keyof Scores;
    value: Feedback;
    question: string;
    setFeedback: (id: keyof Scores, newvalue: string) => void;
    focusref?: React.MutableRefObject<HTMLInputElement | null>
}
function FeedbackSlider({focusref, id, question, setFeedback, value}: FeedbackProps) {
    const marks = [
    {value: 1, label:"1: absolutely not"},
    {value: 3, label:"3: debatably"},
    {value: 5, label:"5: absolutely"},
    ];

    return (<>
            <Text>{question}</Text>
            <Slider 
            ref={focusref}
            label={question}
            min={1}
            max={5}
            defaultValue={3}
            value={value.scores[id]}
            step={1}
            marks={marks}
            onChangeEnd={(e) => {
                setFeedback(id, `${e}`);
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
                switch(e.key) {
                    case "1":
                    case "2":
                    case "3":
                    case "4":
                    case "5":
                        setFeedback(id, e.key);
                        break;
                    case "ArrowUp":
                    case "ArrowRight":
                        setFeedback(id, `${Math.min(value.scores[id] + 1, 5)}` );
                        break;
                    case "ArrowDown":
                    case "ArrowLeft":
                        setFeedback(id, `${Math.max(value.scores[id] - 1, 1)}` );
                        break;

                }
            }}
            />
            </>);
}

interface Scores {
    questionrelevent: number
    questionfromarticle: number
    questionindependence: number
    questionchallenging: number
    answerrelevent: number
    answercomplete: number
    answerfromarticle: number
    answerunique: number
    answeruncontroverial: number
    arithmaticfree: number
    skillcorrect: number
    domaincorrect: number
};
interface Feedback {
    scores: Scores
    comments: string
};

interface FeedbackUIProps {
    questionid: number
    authorid: number
    skipCallback: () => void
    submitCallback: (approved: boolean) => void
}
function FeedbackUI({skipCallback, submitCallback, questionid, authorid} : FeedbackUIProps ) {
    const [feedback, setFeedbackRaw] = useState<Feedback>({
        scores: {
        questionrelevent: 3,
        questionfromarticle: 3,
        questionindependence: 3,
        questionchallenging: 3,
        answerrelevent: 3,
        answercomplete: 3,
        answerfromarticle: 3,
        answerunique: 3,
        answeruncontroverial: 3,
        arithmaticfree: 3,
        skillcorrect: 3,
        domaincorrect: 3,
        },
        comments: ""
    });
    const setFeedback = (id: keyof Scores, newvalue: string) => {
        const newFeedback = {...feedback};
        newFeedback.scores[id] = parseInt(newvalue);
        setFeedbackRaw(newFeedback);
    }
    const ref = useRef<HTMLInputElement | null>(null);
    useEffect(() => {
        if(ref.current !== null) {
            ref.current.focus();
        }
    }, []);

    const SubmitFeedback = async (approve: boolean) => {
        const response = await fetch(import.meta.env.BASE_URL + '../api/review', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                author: authorid,
                question_id: questionid,
                questionrelevent: feedback.scores.questionrelevent,
                questionfromarticle: feedback.scores.questionfromarticle,
                questionindependence: feedback.scores.questionindependence,
                questionchallenging: feedback.scores.questionchallenging,
                answerrelevent: feedback.scores.answerrelevent,
                answercomplete: feedback.scores.answercomplete,
                answerfromarticle: feedback.scores.answerfromarticle,
                answerunique: feedback.scores.answerunique,
                answeruncontroverial: feedback.scores.answeruncontroverial,
                arithmaticfree: feedback.scores.arithmaticfree,
                skillcorrect: feedback.scores.skillcorrect,
                domaincorrect: feedback.scores.domaincorrect,
                comments: feedback.comments,
                accept: approve
            })
        });
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        submitCallback(approve);
    };

    return (<>
        <h1>Feedback</h1>
        <Flex direction="column" gap="lg">
        <FeedbackSlider focusref={ref} id="questionrelevent" setFeedback={setFeedback} value={feedback} question="Using only the text of the question, How relevant is the question to the original article?" />
        <FeedbackSlider id="questionfromarticle" setFeedback={setFeedback} value={feedback} question="Using only the text of the question, can the question be answered definitively based on the article?" />
        <FeedbackSlider id="questionindependence" setFeedback={setFeedback} value={feedback} question="Using only the text of the question, Can this question be answered on its own without the article? (e.g. Does it reference the content of a figure? Quote specific values or phrases?)" />
        <FeedbackSlider id="questionchallenging" setFeedback={setFeedback} value={feedback} question="Using only the text of the question, I think this question is appropriately challenging for a graduate level exam on this topic" />
        <FeedbackSlider id="answerrelevent" setFeedback={setFeedback} value={feedback} question="How relevent is the answer to the question?" />
        <FeedbackSlider id="answerfromarticle" setFeedback={setFeedback} value={feedback} question="How relevent is the answer to the content of the article?" />
        <FeedbackSlider id="answercomplete" setFeedback={setFeedback} value={feedback} question="How completely do the answers respond to the question?" />
        <FeedbackSlider id="answerunique" setFeedback={setFeedback} value={feedback} question="There is only one correct answer?" />
        <FeedbackSlider id="answeruncontroverial" setFeedback={setFeedback} value={feedback} question="Is the answer uncontroverial to the question?" />
        <FeedbackSlider id="arithmaticfree" setFeedback={setFeedback} value={feedback} question="Does this question avoid arithmatic?" />
        <FeedbackSlider id="skillcorrect" setFeedback={setFeedback} value={feedback} question="Are the skills selected appropraite for the question?" />
        <FeedbackSlider id="domaincorrect" setFeedback={setFeedback} value={feedback} question="Are the domains selected appropraite for the question?" />
        <Textarea label="Comments" onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedbackRaw({...feedback, comments: e.currentTarget.value}) }  />
        <Group>
            <Button variant="filled" color="green" onClick={() => SubmitFeedback(true)}>Recommend Approve</Button>
            <Button variant="filled" color="red" onClick={() => SubmitFeedback(false)} >Recommend Reject</Button>
            <Button onClick={() => skipCallback()}>Skip</Button>
        </Group>
        </Flex>
    </>);
}

interface AuthorInfoCallbackData {
    authorName: string
    authorAffiliation: string
    authorPosition: string
    orcid: string
    reviewerSkills: string[]
}
interface AuthorInfoProps {
    configureReviewer: (authorInfo: AuthorInfoCallbackData) => void
    defaults: AuthorInfoCallbackData
}
function AuthorInfo({configureReviewer, defaults}: AuthorInfoProps) {
    const [authorName, setAuthorName] = useState(defaults.authorName || "");
    const [authorPosition, setAuthorPosition] = useState(defaults.authorPosition || "");
    const [authorAffiliation, setAuthorInstition] = useState(defaults.authorAffiliation || "");
    const [orcid, setORCID] = useState(defaults.orcid || "");
    const [reviewerSkills, setReviewerSkills] = useState<string[]>(defaults.reviewerSkills || []);

    const readyToReview = useMemo(() => {
        if (authorName === "") return false;
        if (authorAffiliation === "") return false;
        if (reviewerSkills.length === 0) return false;
        return true;
    }, [authorName, authorAffiliation, reviewerSkills, authorPosition]);

    const configure = () => {
        configureReviewer({
            authorName: authorName,
            authorAffiliation: authorAffiliation,
            authorPosition: authorPosition,
            orcid: orcid,
            reviewerSkills: reviewerSkills
        });
    }

    return (
            <Flex direction="column">
            <TextInput required value={authorName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setAuthorName(e.currentTarget.value)}}  label="Name" placeholder="What is your name?" />
            <TextInput required value={authorAffiliation} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setAuthorInstition(e.currentTarget.value)}}  label="Affiliation" placeholder="What is your affiliation?" />
                <NativeSelect
                    required
                    value={authorPosition}
                    onChange={(e) => setAuthorPosition(e.currentTarget.value)}
                    label="Position"
                    data={
                        authorPosition ? 
                        allowedPositions.map(pos => ({ value: pos, label: pos })) : 
                        [
                            { value: '', label: 'Select position', disabled: true }, 
                            ...allowedPositions.map(pos => ({ value: pos, label: pos }))
                        ]
                    }
                    styles={() => ({
                        input: {
                          color: authorPosition ? 'black' : 'rgb(173, 181, 189)',
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
            <TextInput value={orcid} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setORCID(e.currentTarget.value)}}  label="ORCID" placeholder="What is your ORCID if you have one?" />
            <MultiSelect required value={reviewerSkills} onChange={setReviewerSkills} label="Domains" data={allowedDomains} searchable placeholder="What domains can you review for?" />
            <Button disabled={!readyToReview} onClick={(_e: React.MouseEvent) => { configure() }}>Start Reviewing</Button>
            </Flex>);
}

export function QuestionReviewing () {
    const [configured, setConfigured] = useState<boolean>(false);
    const [authorInfo, setAuthorInfo] = useState<AuthorInfoCallbackData>({
        authorName: "",
        authorAffiliation: "",
        orcid: "",
        authorPosition: "",
        reviewerSkills: [],
    });
    const [authorID, setAuthorID] = useState(0);
    const [progress, setProgress] = useState<ProgressProps>({
        project: "AuroraGPT",
        sofar: 0,
        goal: 0,
        history: [],
        to_review: []
    })
    const [idx, setIdx] = useState<number>(0);
    const [questions, setQuestions] = useState<Questions[]>([]);

    const configureReviewer = async (authorInfo: AuthorInfoCallbackData) => {
        setAuthorInfo(authorInfo);
        const author_response = await fetch(import.meta.env.BASE_URL + '../api/author', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: authorInfo.authorName,
                affilliation: authorInfo.authorAffiliation,
                position: authorInfo.authorPosition,
                orcid: authorInfo.orcid
            })
        });
        if (!author_response.ok) {
            throw new Error(author_response.statusText);
        }
        const server_author_info = await author_response.json();
        console.log("author_info", server_author_info);
        setAuthorID(server_author_info.id);

        const reviewbatch_response = await fetch(import.meta.env.BASE_URL + '../api/review_batch', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                author: server_author_info.id,
                domains: authorInfo.reviewerSkills
            })
        });
        if (!reviewbatch_response.ok) {
            throw new Error(reviewbatch_response.statusText);
        }
        const to_review_ids: number[] = await reviewbatch_response.json();
        console.log("to_review_ids", to_review_ids);

        const reviewhistory_response = await fetch(import.meta.env.BASE_URL + `../api/reviewhistory/${authorID}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        if (!reviewhistory_response.ok) {
            throw new Error(reviewbatch_response.statusText);
        }
        const reviewer_history: History[] = await reviewhistory_response.json();
        console.log("history", reviewer_history);
        
        setProgress((progress: ProgressProps) => { return {...progress, to_review: to_review_ids, goal: to_review_ids.length, history: reviewer_history}});

        if(to_review_ids.length > 0) {
            const ids_query = "?" + to_review_ids.map(x => `ids=${x}`).join('&');
            const questions_response = await fetch(import.meta.env.BASE_URL + `../api/question${ids_query}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            if (!questions_response.ok) {
                throw new Error(questions_response.statusText);
            }
            const review_questions = await questions_response.json()
            console.log("review_questions", review_questions);
            setQuestions(review_questions);
        }
        
        setConfigured(true);
    };

    const skipCallback = () => {
        setProgress((progress : ProgressProps) => {
            return {
                ...progress,
                sofar: progress.sofar+1,
                history: [
                    ...progress.history,
                    {
                        id: questions[idx].id!,
                        question: questions[idx].question,
                        action: ReviewAction.skipped
                    }
                ]
            }
        });
        setIdx((idx: number) => idx + 1);
        window.scrollTo({top: 0, left: 0, behavior: 'instant'});
        notifications.show({title: 'skipped question', message: `This question will be reconsidered later`, autoClose: 5000});
    };
    const submitCallback = (approved: boolean) => {
        setProgress((progress: ProgressProps) => { return {
            ...progress,
            sofar: progress.sofar+1,
            history: [
                ...progress.history,
                {
                    id: questions[idx].id!,
                    question: questions[idx].question,
                    action: (approved)? ReviewAction.approved: ReviewAction.rejected
                }
            ]
        }});
        setIdx((idx : number) => idx + 1);
        window.scrollTo({top: 0, left: 0, behavior: 'instant'});
        notifications.show({title: 'submitted review', message: `successfully submitted your question: ${questions[idx].id!}: ${questions[idx].question}`, autoClose: 5000});
    };

    return (<>
            <HeaderSimple author={authorInfo.authorName} reconfigure={()=>{setConfigured(false)}} />
            <Notifications position="top-center" />
            <Container>
            {(configured) ?
            (<Grid>
             <Grid.Col span={4}>
             <Container>
             <ProgressTrackerUI {...progress} />
             </Container>
             </Grid.Col>
             <Grid.Col span={8}>
             <Container>
             {(questions.length > 0 && idx < questions.length) ?
                 <>
                     <QuestionDetailView question={questions[idx]}/>
                     <FeedbackUI questionid={questions[idx].id || 0} authorid={authorID} skipCallback={skipCallback} submitCallback={submitCallback} />
                 </>:
                 <>
                    <h1>Thanks for offering to review</h1>
                    <Text>We have no more questions requiring your expertise at this time.  Please come back later after more questions have been developed, or select more review topics.</Text>
                 </>
             }
             </Container>
             </Grid.Col>
             </Grid>): (
             <AuthorInfo configureReviewer={configureReviewer} defaults={authorInfo} />
                 )}
            </Container> 
                </>);
}
