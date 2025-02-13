import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import {useState, useMemo, useCallback} from 'react';
import {Container, Radio, Button, Autocomplete, TextInput, Textarea, FileInput, Tabs, Text} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useGlobusAuth } from '@globus/react-auth-context';
import debounce from 'lodash.debounce';

import {HeaderSimple} from "./HeaderSimple";
import {AuthorInfoCallbackData, AuthorInfo} from "./AuthorInfo";
import {AuthorResponseSchema, ExperimentLogSchema} from './API';

enum LabStyleStage {
    ProblemSetup,
    Prompting,
    FinalEvaluation
}
interface LabStyleState {
    mode: LabStyleStage,
    experiment_id: number | null
};

interface ProblemSetupProps {
    state: LabStyleState
    finishSetup: () => void,
};
function ProblemSetup({finishSetup, state}: ProblemSetupProps) {
    const [experience, setExperience] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [model, setModel] = useState('GPT o3 Mini');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const validate = useMemo(() => {
        return !(title != "" && description != "")
    }, [title, description])
    const finish = async () => {
        try {
            const prompt_response = await fetch(import.meta.env.BASE_URL + '../api/experimentlogfinal', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(
                    {
                        experimentId: state.experiment_id,
                        experience: experience,
                        difficulty: difficulty,
                        model: model,
                        title: title,
                        description: description,
                    }
                )
            });
            if(!prompt_response.ok) {
                 throw new Error(prompt_response.statusText);
            }
            await prompt_response.json();
            finishSetup()
        } catch(error) {
            notifications.show({title: 'failed to finish evaluation', message: `failed testing your question: ${error}`});
        }

    };
    return <>
        <h1>Problem Setup</h1>
        <Radio.Group
            value={experience}
            onChange={setExperience}
            name="levelOfExperience"
            label="On average, what is your level of experience with advanced AI systems such as ChatGPT, Claude, LLama3, etc?"
        >
            <Radio value="daily" label="I use them several times a day" />
            <Radio value="weekly" label="I use them several times in a week" />
            <Radio value="monthly" label="I use them several times a month" />
            <Radio value="yearly" label="I use them once a month or less" />
            <Radio value="infrequently" label="I have never used them before" />
        </Radio.Group>
        <Autocomplete 
            clearable
            defaultValue="GPT o3 Mini"
            label="What model did you use?"
            data={['GPT o3 Mini', 'GPT 4o']}
            onChange={(e) => setModel(e)}
            value={model}
        />
        <TextInput label="Title for your experiment" onChange={(e) => setTitle(e.currentTarget.value)} value={title} />
        <Textarea label="What problem should the AI solve, and what steps are needed to solve this problem?" minRows={4} autosize onChange={(e) => setDescription(e.currentTarget.value)} value={description}/>
        <Radio.Group
            value={difficulty}
            onChange={setDifficulty}
            name="levelOfDifficulty"
            label="How would you describe the level of difficulty of the problem?"
        >
            <Radio value="staff" label="The task requires highly advanced understanding and a high degree of independence" />
            <Radio value="postdoc" label="The task requires advanced understanding, and can perform some tasks on its own" />
            <Radio value="gradstudent" label="The task requires a solid understanding and some ability to perform smaller tasks or initiatives." />
            <Radio value="student" label="The task tolerates  some gaps in knowledge or collaboration, requiring guidance and doable with guidance from others" />
            <Radio value="public" label="This should be doable with minimal knowledge
" />
        </Radio.Group>
        <Button onClick={finish} disabled={validate} >start prompting</Button>
    </>;
}
interface FinalEvaluationProps {
    finishEvaluation: () => void;
    state: LabStyleState
};
function FinalEvaluation({finishEvaluation, state}: FinalEvaluationProps) {
    const [advantage, setAdvantage] = useState('');
    const [advantageExplaination, setAdvantageExplaination] = useState('');
    const [productivity, setProductivity] = useState('');
    const [productivityExplaination, setProductivityExplaination] = useState('');
    const [teamwork, setTeamwork] = useState('');
    const [teamworkExplaination, setTeamworkExplaination] = useState('');
    const [innovation, setInnovation] = useState('');
    const [innovationExplaination, setInnovationExplaination] = useState('');
    const [neededFeatures, setNeededFeatures] = useState('');
    const [completeness, setCompleteness] = useState('');
    const [completenessExplaination, setCompletenessExplaination] = useState('');
    const [feedback, setFeedback] = useState('');

    const finish = async () => {
        try {
            const prompt_response = await fetch(import.meta.env.BASE_URL + '../api/experimentlogfinal', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(
                    {
                        experimentId: state.experiment_id,
                        advantage: advantage,
                        advantageExplaination: advantageExplaination,

                        productivity: productivity,
                        productivityExplaination: productivityExplaination,

                        teamwork: teamwork,
                        teamworkExplaination: teamworkExplaination,

                        innovation: innovation,
                        innovationExplaination: innovationExplaination,
                        neededFeatures: neededFeatures,

                        completeness: completeness,
                        completenessExplaination: completenessExplaination,

                        feedback: feedback,
                    }
                )
            });
            if(!prompt_response.ok) {
                 throw new Error(prompt_response.statusText);
            }
            await prompt_response.json();
            finishEvaluation()
        } catch(error) {
            notifications.show({title: 'failed to finish evaluation', message: `failed testing your question: ${error}`});
        }
    };

    return <>
        <h1>Final Evaluation Setup</h1>
        <Textarea label="What if any help was given by the event staff while using this model?" autosize minRows={4} />
        <Radio.Group
            value={advantage}
            onChange={setAdvantage}
            name="advantage"
            label="Based on the model's performance today, How much of a comparative advantage would it be to have readily available access to this tool?"
        >
            <Radio value="staff" label="Not having access to this capability would put us at a marked disadvantage relative to teams that have it." />
            <Radio value="postdoc" label="Our contributions will be meaningfully better with this capability, but not to such a degree that there would be a stark contrast with otherwise equally capable teams that do not have access to it." />
            <Radio value="gradstudent" label="We could take it or leave it." />
            <Radio value="student" label="It’s hard to see this having much value, but it probably will not do any harm to have access to the capability." />
            <Radio value="public" label="This capability is a distraction and would lower our contributions" />
        </Radio.Group>
        <Textarea label="Explain the selection for the previous question" autosize minRows={4} 
                        value={advantageExplaination} onChange={(e) =>  setAdvantageExplaination(e.currentTarget.value)}
        />
        <Radio.Group
            value={innovation}
            onChange={setInnovation}
            name="innovation"
            label="Based on the performance on this problem, How innovative are responses from the model?"
        >
            <Radio value="staff" label="The idea or solution leads to groundbreaking innovation or significantly expands on current knowledge presenting a novel approach" />
            <Radio value="postdoc" label="The idea offers a notable contribution to advancing current knowledge, providing a creative yet somewhat familiar soluon." />
            <Radio value="gradstudent" label="The solution is somewhat innovative but doesn't present a strong novel element, building largely on existing ideas" />
            <Radio value="student" label="The solution is not particularly novel or creative, mostly reiterating known approaches with limited new insight." />
            <Radio value="public" label="The solution lacks any novel contribution, adding nothing new to current understanding or practices" />
        </Radio.Group>
        <Textarea label="Explain the selection for the previous question" autosize minRows={4} 
                        value={innovationExplaination} onChange={(e) =>  setInnovationExplaination(e.currentTarget.value)}
        />
        <Radio.Group
            value={productivity}
            onChange={setProductivity}
            name="productivity"
            label="Based on the models performance on this problem, The productivity and effectiveness of this model:"
        >
            <Radio value="staff" label="Demonstrates exceptional knowledge and leadership, contributing at a highly advanced level, mentoring others, and consistently driving the team’s success." />
            <Radio value="postdoc" label="Shows a high level of expertise, frequently contributes valuable insights, and is a strong asset to the team with considerable collaboration and problem-solving skills." />
            <Radio value="gradstudent" label="Contributes adequately to the team, demonstrating a solid understanding and providing reliable support with some ability to lead smaller tasks or initiatives." />
            <Radio value="student" label="Contributions are inconsistent, with some gaps in knowledge or collaboration, requiring guidance from others and affecting the team’s overall performance." />
            <Radio value="public" label="Shows minimal contribution, lacks the necessary skills or initiative, and requires significant oversight, hindering the team’s progress" />
        </Radio.Group>
        <Textarea label="Explain your selection on the previous question" autosize minRows={4} 
                        value={productivityExplaination} onChange={(e) =>  setProductivityExplaination(e.currentTarget.value)}
        />
        <Radio.Group
            value={teamwork}
            onChange={setTeamwork}
            name="teamwork"
            label="Based on the model’s performance on this problem, how much would the model to impact a team's productivity?"
        >
            <Radio value="staff" label="It would significantly enhance the team’s productivity by consistently optimizing workflows, driving efficiency, and removing bottlenecks." />
            <Radio value="postdoc" label="It would noticeably improve productivity through reliable and effective contributions, facilitating the team’s ability to meet deadlines and goals." />
            <Radio value="gradstudent" label="It would contribute adequately to productivity, supporting the team’s progress but without major improvements in speed or efficiency." />
            <Radio value="student" label="Its impact on productivity would be minimal, occasionally contributing to delays or inefficiencies due to lack of timely support." />
            <Radio value="public" label="It would negatively impact productivity, causing significant delays or inefficiencies, hindering the team’s ability to perform optimally." />
        </Radio.Group>
        <Textarea label="Explain your selection on the previous question" autosize minRows={4} 
                        value={teamworkExplaination} onChange={(e) =>  setTeamworkExplaination(e.currentTarget.value)}
        />
        <Textarea label="What features or knowledge would increase the score on the previous two questions" autosize minRows={4} 
                        value={neededFeatures} onChange={(e) =>  setNeededFeatures(e.currentTarget.value)}
        />
        <Radio.Group
            value={completeness}
            onChange={setCompleteness}
            name="completeness"
            label="Based on the model's performance, how complete, correct, or plausible was the proposed solution?"
        >
            <Radio value="staff" label="The idea or solution is exceptional, well thought-out, and addresses all key challenges, with clear potential for success and application." />
            <Radio value="postdoc" label="The idea or solution is strong, generally well thought-out, and addresses most key challenges effectively, with good potential for success." />
            <Radio value="gradstudent" label="The idea or solution is acceptable, addressing some challenges, though with potential gaps or weaknesses." />
            <Radio value="student" label="The idea or solution is weak, with several critical gaps or challenges that limit its feasibility or success potential." />
            <Radio value="public" label="The idea or solution is poorly conceived, lacks coherence, and fails to address key challenges, with little chance of success." />
        </Radio.Group>
        <Textarea label="Explain why your rating for the model's correctness, completeness, and plausibility" autosize minRows={4} 
                        value={completenessExplaination} onChange={(e) =>  setCompletenessExplaination(e.currentTarget.value)}
        />
        <Textarea label="Any feedback on the event or these questions?" autosize minRows={4} 
                        value={feedback} onChange={(e) =>  setFeedback(e.currentTarget.value)}
        />
        <Button onClick={finish}>finish evaluation</Button>
        </>;
}

interface PromptingProps {
    nextPrompt: () => void;
    finishPrompting: () => void;
    state: LabStyleState
};
function Prompting({nextPrompt, finishPrompting, state}: PromptingProps) {
    const [goal, setGoal] = useState<string>("");
    const [prompt, setPrompt] = useState<string>("");
    const [output, setOutput] = useState<string>("");
    const [promptHistory, setPromptHistory] = useState<string[]>([]);
    const updateHistory = useCallback(
        debounce((value: string) => {
            setPromptHistory((old) =>{
                return [...old, value]; 
            });
        }, 5000), []
    );
    const updatePrompt = (new_value: string) => {
        setPrompt(new_value);
        updateHistory(new_value);
    };
    const [previousTurn, setPreviousTurn] = useState<number>(0);
    const [understanding, setUnderstanding] = useState("");
    const [review, setReview] = useState("");
    const [hypothesis, setHypothesis] = useState("");
    const [planning, setPlanning] = useState("");
    const [analysis, setAnalysis] = useState("");
    const [conclusions, setConclusions] = useState("");
    const [understandingExplaination, setUnderstandingExplaination] = useState("");
    const [reviewExplaination, setReviewExplaination] = useState("");
    const [hypothesisExplaination, setHypothesisExplaination] = useState("");
    const [planningExplaination, setPlanningExplaination] = useState("");
    const [analysisExplaination, setAnalysisExplaination] = useState("");
    const [conclusionsExplaination, setConclusionsExplaination] = useState("");
    // TODO be sure to call updatePrompt.flush() before submission
    
    const submitPrompt = async () => {
        //first submit the old prompt
        const prompt_response = await fetch(import.meta.env.BASE_URL + '../api/experimentlogprompt', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(
                {
                    experiment_id: state.experiment_id,
                    previousTurn: previousTurn,
                    goal: goal,
                    prompt: promptHistory,
                    output: output,

                    analysis: analysis,
                    analysisExplaination: analysisExplaination,

                    conclusions: conclusions,
                    conclusionsExplaination: conclusionsExplaination,

                    hypothesis: hypothesis,
                    hypothesisExplaination: hypothesisExplaination,

                    planning: planning,
                    planningExplaination: planningExplaination,

                    review: review,
                    reviewExplaination: reviewExplaination,

                    understanding: understanding,
                    understandingExplaination: understandingExplaination,
                }
            )
        });
        if(!prompt_response.ok) {
             throw new Error(prompt_response.statusText);
        }
        const server_prompt_response = await prompt_response.json();

        
        //TODO handle file uploads
        for (const file of files) {

            const file_response = await fetch(import.meta.env.BASE_URL + '../api/experimentlogfile', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(
                    {
                        turn_id: server_prompt_response.id,
                        contents: await file.arrayBuffer(), //TODO this is probably not right
                    }
                )
            });
            if(!file_response.ok) {
                 throw new Error(file_response.statusText);
            }

            console.log(file);
        }


        setPreviousTurn(server_prompt_response.id);
        

        //then reset the state for the next prompt
        setGoal("");
        setFiles([]);
        setPrompt("");
        setOutput("");
        setPromptHistory([]);
        setUnderstanding("");
        setReview("");
        setHypothesis("");
        setPlanning("");
        setAnalysis("");
        setConclusions("");
        setUnderstandingExplaination("");
        setReviewExplaination("");
        setHypothesisExplaination("");
        setPlanningExplaination("");
        setAnalysisExplaination("");
        setConclusionsExplaination("");
        nextPrompt();
    }
    
    const submitAndFinishPrompt = async () => {
        await submitPrompt();
        finishPrompting();
    }

    const [files, setFiles] = useState<File[]>([]);
    return (<>
        <h1>Prompting</h1>
            <h2>First, think about your prompt</h2>
            <Textarea label="What is the goal of this prompt?" autosize minRows={4} value={goal} onChange={(e) => setGoal(e.currentTarget.value)} />
            <Textarea label="What is the prompt?" autosize minRows={4} value={prompt} onChange={(e) => updatePrompt(e.currentTarget.value)} />
            <FileInput 
                label="Please upload files provided in the prompt if any"
                placeholder="Click to upload files"
                clearable
                multiple
                value={files}
                onChange={setFiles}
            />
            <h2>Now, run the prompt</h2>
            <Textarea label="Please copy and paste the output" autosize minRows={4} value={output} onChange={(e) => setOutput(e.currentTarget.value)} />
            <h2>What skill(s) did you evaluate with this prompt?</h2>
            <Tabs defaultValue="intro">
                <Tabs.List>
                    <Tabs.Tab value="intro">Introduction to Skills Evaluation</Tabs.Tab>
                    <Tabs.Tab value="understanding">Problem Understanding</Tabs.Tab>
                    <Tabs.Tab value="review">Literature Review</Tabs.Tab>
                    <Tabs.Tab value="hypothesis">Hypothesis Generation</Tabs.Tab>
                    <Tabs.Tab value="planning">Planning/Design</Tabs.Tab>
                    <Tabs.Tab value="analysis">Result Analysis</Tabs.Tab>
                    <Tabs.Tab value="conclusions">Draw Conclusions</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="intro">
                    <Text>Please evaluate any skills you think are appropriate for this response by clicking on the tabs for the skills you wish to evaluate.  You may scores as many or as few as you like for each response. When you are finished, you can click "keep prompting" ask a new prompt or "finish" to move onto a new evaluation</Text>
                </Tabs.Panel >
                <Tabs.Panel value="understanding">
                    <Radio.Group
                        value={understanding}
                        onChange={setUnderstanding}
                        name="understanding"
                        label="Which of the following best dscribes the models problem understanding skills?"
                    >
                        <Radio value="staff" label="Showcases exceptional insight into the problem. Connects it to a broad spectrum of theories and practices. Anticipates future challenges and opportunities. Contributes original thoughts that shape understanding within the field. Influences how the problem is perceived and addressed.
" />
                        <Radio value="postdoc" label="Demonstrates comprehensive and nuanced understanding. Clearly articulates complexities, interdependencies, and broader impacts. Identifies gaps in existing knowledge and potential areas for advancement. Employs critical thinking to question assumptions and explore alternative perspectives." />
                        <Radio value="gradstudent" label="Exhibits thorough understanding of the problem, including underlying mechanisms and contributing factors. Articulates the significance and context within the field. Recognizes complexities and explores interrelationships between concepts. Begins to consider potential challenges.
" />
                        <Radio value="student" label="Shows a basic grasp of the main aspects of the problem. Identifies primary issues but overlooks complexities and subtleties. Provides general explanations but may oversimplify critical elements. Requires guidance to comprehend deeper implications.
" />
                        <Radio value="public" label="Demonstrates minimal understanding of the research problem. Misinterprets key concepts and objectives. Fails to recognize the significance or relevance within the field. May confuse or conflate unrelated ideas.
" />
                    </Radio.Group>
                    <Textarea
                        label="What aspects of the response drive this score?" autosize minRows={4}
                        value={understandingExplaination} onChange={(e) =>  setUnderstandingExplaination(e.currentTarget.value)}
                    />
                </Tabs.Panel >
                <Tabs.Panel value="review">
                    <Radio.Group
                        value={review}
                        onChange={setReview}
                        name="review"
                        label="Which of the following best dscribes the model's literature review skills?"
                    >
                        <Radio value="staff" label="Exhibits exhaustive knowledge of the literature, including emerging and obscure works. Establishes connections across fields to provide innovative perspectives. The review contributes new insights or proposes novel frameworks. Influences future research directions through synthesis provided." />
                        <Radio value="postdoc" label="Delivers a comprehensive literature review, including foundational works and the latest research. Synthesizes information to identify inconsistencies and debates within the field. Integrates interdisciplinary sources where appropriate. Evaluates methodologies and theoretical frameworks critically." />
                        <Radio value="gradstudent" label="Provides a well-rounded review, referencing key studies and prominent authors. Utilizes appropriate collections to source relevant and credible rigorous articles. Critically assesses and synthesizes information from multiple sources. Identifies main themes and gaps in the literature." />
                        <Radio value="student" label="Includes a basic selection of literature using general sources. References some relevant works but misses significant studies. Shows limited ability to assess source credibility. Relies heavily on textbooks or secondary summaries instead of primary research articles." />
                        <Radio value="public" label="Presents minimal or irrelevant literature. Sources are outdated, non-rigorous, or inappropriate. Fails to include key studies or influential authors. Does not demonstrate understanding of the existing research landscape. " />
                    </Radio.Group>
                    <Textarea
                        label="What aspects of the response drive this score?" autosize minRows={4}
                        value={reviewExplaination} onChange={(e) =>  setReviewExplaination(e.currentTarget.value)}
                    />
                </Tabs.Panel >
                <Tabs.Panel value="hypothesis">
                    <Radio.Group
                        value={hypothesis}
                        onChange={setHypothesis}
                        name="hypothesis"
                        label="Which of the following best dscribes the model's hypothesis generation skills?"
                    >
                        <Radio value="staff" label="Formulates innovative, groundbreaking hypotheses or questions challenging existing paradigms. Reflects profound understanding of the field's trajectory. Proposals are influential, setting new research directions and reshaping the discipline. " />
                        <Radio value="postdoc" label="Generates sophisticated hypotheses or questions addressing gaps or controversies. Shows creativity and deep theoretical understanding. Considers alternative outcomes and implications. Potential to advance knowledge significantly.
" />
                        <Radio value="gradstudent" label="Constructs a clear, focused, and testable hypothesis or question grounded in literature. Demonstrates originality and relevance. Defines variables and anticipated relationships. Aligns with established theories and concepts.
" />
                        <Radio value="student" label="Develops a basic hypothesis or question that addresses the problem superficially. May lack depth or originality. Testable but not well-aligned with theoretical frameworks. Requires refinement to clarify variables and scope.
" />
                        <Radio value="public" label="Does not formulate a clear hypothesis or research question. Ideas are vague, unfocused, or untestable. Shows little connection to the problem or literature. Lacks originality and understanding of research fundamentals.
" />
                    </Radio.Group>
                    <Textarea
                        label="What aspects of the response drive this score?" autosize minRows={4}
                        value={hypothesisExplaination} onChange={(e) =>  setHypothesisExplaination(e.currentTarget.value)}
                    />
                </Tabs.Panel >
                <Tabs.Panel value="planning">
                    <Radio.Group
                        value={planning}
                        onChange={setPlanning}
                        name="planning"
                        label="Which of the following best dscribes the model's methodology planning and experiment design skills?"
                    >
                        <Radio value="staff" label="Designs an exemplary plan setting new field standards. Incorporates cutting-edge methods and technologies. Optimizes efficiency and effectiveness. May introduce novel methodologies influencing research practices. " />
                        <Radio value="postdoc" label="Crafts a comprehensive, methodologically sound plan integrating advanced techniques. Anticipates challenges and includes contingencies. Ensures rigorous adherence to ethical standards. Potential to yield significant, reliable results." />
                        <Radio value="gradstudent" label="Develops a detailed, logical plan. Includes appropriate methods, procedures, and resources. Identifies variables, controls, and limitations. Demonstrates understanding of ethical considerations and feasibility. " />
                        <Radio value="student" label="Outlines a basic plan with general procedures. Lacks detail and may overlook important variables or controls. Doesn't fully consider feasibility or ethics. Requires significant improvement to be viable." />
                        <Radio value="public" label="Provides no plan or an incoherent, impractical one. Fails to address methodological considerations. Omits critical components like objectives or procedures. Neglects ethical, practical, or logistical factors." />
                    </Radio.Group>
                    <Textarea
                        label="What aspects of the response drive this score?" autosize minRows={4}
                        value={planningExplaination} onChange={(e) =>  setPlanningExplaination(e.currentTarget.value)}
                    />
                </Tabs.Panel >
                <Tabs.Panel value="analysis">
                    <Radio.Group
                        value={analysis}
                        onChange={setAnalysis}
                        name="analysis"
                        label="Which of the following best dscribes the model's result analysis skills?"
                    >
                        <Radio value="staff" label="Provides profound analysis leading to new understandings or discoveries. Develops or applies innovative techniques. Results significantly influence the field. Analysis informs policy, practice, or sets new research agendas." />
                        <Radio value="postdoc" label="Performs sophisticated analysis revealing nuanced insights. Utilizes advanced methods and validates findings. Integrates results with theoretical frameworks. Critically evaluates significance and impact. " />
                        <Radio value="gradstudent" label="Conducts thorough analysis using appropriate tools. Accurately interprets results, relating them to research questions and literature. Acknowledges limitations and considers alternatives. Demonstrates critical thinking. " />
                        <Radio value="student" label="Performs basic analysis using standard methods. Identifies some findings but may miss deeper insights. May make calculation or reasoning errors. Restates results without significant insight. " />
                        <Radio value="public" label="Provides minimal or incorrect analysis. Misinterprets findings or fails to identify key patterns. Does not use appropriate methods. Overlooks anomalies or errors. " />
                    </Radio.Group>
                    <Textarea
                        label="What aspects of the response drive this score?" autosize minRows={4}
                        value={analysisExplaination} onChange={(e) =>  setAnalysisExplaination(e.currentTarget.value)}
                    />
                </Tabs.Panel >
                <Tabs.Panel value="conclusions">
                    <Radio.Group
                        value={conclusions}
                        onChange={setConclusions}
                        name="conclusions"
                        label="Which of the following best dscribes the model's conclusion drawing skills?"
                    >
                        <Radio value="staff" label="Delivers compelling conclusions redefining understanding of the topic. Articulates transformative impacts on the field. Writing is of publishable quality in prestigious journals. Conclusions influence research agendas and policy decisions. " />
                        <Radio value="postdoc" label="Crafts comprehensive conclusions integrating findings into broader discourse. Explores theoretical, practical implications in depth. Provides insightful recommendations for further study or practice." />
                        <Radio value="gradstudent" label="Draws clear, logical conclusions addressing objectives. Synthesizes findings and discusses significance within the field. Explores potential applications. Suggests areas for future research." />
                        <Radio value="student" label="Summarizes findings at a basic level. Conclusions may restate results without deeper insight. Limited discussion of significance or applications. Does not suggest future research directions. " />
                        <Radio value="public" label="Fails to draw meaningful conclusions or provides unsupported ones. Does not address hypotheses or objectives. Writing is unclear and disorganized. Overlooks broader implications." />
                    </Radio.Group>
                    <Textarea
                        label="What aspects of the response drive this score?" autosize minRows={4}
                        value={conclusionsExplaination} onChange={(e) =>  setConclusionsExplaination(e.currentTarget.value)}
                    />
                </Tabs.Panel >
            </Tabs>
            <Button onClick={submitPrompt}>keep prompting</Button>
            <Button onClick={submitAndFinishPrompt}>finish</Button>
        </>);
}

export function LabStyle() {
    const {isAuthenticated, authorization} = useGlobusAuth();
    const [authorInfo, setAuthorInfo] = useState<AuthorInfoCallbackData>({
        authorName: authorization?.user?.name || "",
        authorAffiliation: authorization?.user?.organization || "",
        orcid: "",
        authorPosition: "",
        reviewerSkills: [],
    });
    const [experimentState, setExperimentState] = useState<LabStyleState>({
        mode: LabStyleStage.ProblemSetup,
        experiment_id: null
    });
    const [configured, setConfigured] = useState<boolean>(false);
    const reconfigure = () => {
        setConfigured(false);
    };
    const configureAuthor = async (authorInfo: AuthorInfoCallbackData) => {

        try {
        const author_response = await fetch(import.meta.env.BASE_URL + '../api/author', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(
                {
                    name: authorInfo.authorName,
                    affilliation: authorInfo.authorAffiliation,
                    position: authorInfo.authorPosition,
                    orcid: authorInfo.orcid
                }
            )
        });
        if(!author_response.ok) {
             throw new Error(author_response.statusText);
        }
        const server_author_info: AuthorResponseSchema = await author_response.json();

        const experimentlog_response = await fetch(import.meta.env.BASE_URL + '../api/experimentlog', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(
                {
                    author_id: server_author_info.id
                }
            )
        });
        if(!experimentlog_response.ok) {
             throw new Error(experimentlog_response.statusText);
        }
        const server_experiment_log: ExperimentLogSchema = await experimentlog_response.json();

        setAuthorInfo({
            authorName: server_author_info.author,
            authorAffiliation: server_author_info.affiliation,
            authorPosition: server_author_info.position,
            orcid: server_author_info.orcid || "",
            reviewerSkills: authorInfo.reviewerSkills
        });
        setExperimentState({
            experiment_id: server_experiment_log.experiment_id,
            mode: LabStyleStage.ProblemSetup
        });
        setConfigured(true);
        } catch(error) {
            notifications.show({title: 'failed to start experiment', message: `failed testing your question: ${error}`});
        }
    };

    const finishSetup = () => {
        setExperimentState({...experimentState, mode: LabStyleStage.Prompting});
    };
    const nextPrompt = () => {
        setExperimentState({...experimentState, mode: LabStyleStage.Prompting});
    };
    const finishPrompting = () => {
        setExperimentState({...experimentState, mode: LabStyleStage.FinalEvaluation});
    };
    const finishEvaluation = () => {
        setExperimentState({...experimentState, mode: LabStyleStage.ProblemSetup});
    };

    let lab_form;
    switch (experimentState.mode) {
        case LabStyleStage.ProblemSetup:
            lab_form = <ProblemSetup finishSetup={finishSetup} state={experimentState}/>;
            break;
        case LabStyleStage.Prompting:
            lab_form = <Prompting nextPrompt={nextPrompt} finishPrompting={finishPrompting} state={experimentState}/>;
            break;
        case LabStyleStage.FinalEvaluation:
            lab_form = <FinalEvaluation finishEvaluation={finishEvaluation} state={experimentState}/>;
            break;
    }
    
    return (<>
            <HeaderSimple title="LabStyle Experiments" reconfigure={reconfigure} author={authorInfo.authorName} />
            <Container>
            {
                (configured && isAuthenticated)?
                    (lab_form):
                    (<AuthorInfo authRequired={true} actionTitle="Experimenting" configureAuthor={configureAuthor} defaults={authorInfo}/>)
            }
            </Container>
    </>);
}
