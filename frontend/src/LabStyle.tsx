import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { useState, useMemo, useCallback } from "react";
import {
  Autocomplete,
  Button,
  Checkbox,
  Container,
  FileInput,
  Flex,
  List,
  Radio,
  Tabs,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { notifications, Notifications } from "@mantine/notifications";
import debounce from "lodash.debounce";

import { HeaderSimple } from "./HeaderSimple";
import {
  AuthorInfoCallbackData,
  AuthorInfo,
  AuthorInfoProps,
} from "./AuthorInfo";
import { AuthorResponseSchema } from "./API";

enum LabStyleStage {
  ProblemSetup,
  Prompting,
  FinalEvaluation,
}
interface LabStyleState {
  mode: LabStyleStage;
  experiment_id: number | null;
  allowScore: boolean;
}

interface ProblemSetupProps {
  state: LabStyleState;
  finishSetup: () => void;
}

function AnonAuthorInfo({ configureAuthor }: AuthorInfoProps) {
  const [password, setPassword] = useState("");
  const checkPassword = () => {
    configureAuthor({
      authorName: "labstyle anon author",
      authorAffiliation: "",
      authorPosition: "",
      orcid: "",
      reviewerSkills: [],
    });
  };
  return (
    <Flex direction="column">
      <Text>
        Thanks for participating in the 1000 Scientist Jam. Please enter the
        event password provided to you by the organizers to continue.
      </Text>
      <TextInput
        label="Event Password"
        value={password}
        onChange={(e) => setPassword(e.currentTarget.value)}
      />
      <Button onClick={checkPassword}>Start Experimenting</Button>
    </Flex>
  );
}
function ProblemSetup({ finishSetup, state }: ProblemSetupProps) {
  const experience_levels = {
    daily: "I use them several times a day",
    weekly: "I use them several times in a week",
    infrequently: "I have never used them before or used them infrequently",
  };
  const difficulty_levels = {
    staff:
      "The task requires highly advanced understanding and a high degree of independence",
    postdoc:
      "The task requires advanced understanding, and can perform some tasks on its own",
    gradstudent:
      "The task requires a solid understanding and some ability to perform smaller tasks or initiatives.",
    student:
      "The task tolerates  some gaps in knowledge or collaboration, requiring guidance and doable with guidance from others",
    public: "This should be doable with minimal knowledge ",
  };

  const [experience, setExperience] = useState<
    keyof typeof experience_levels | ""
  >("");
  const [reasoningExperience, setReasoningExperience] = useState<
    keyof typeof experience_levels | ""
  >("");
  const [difficulty, setDifficulty] = useState<
    keyof typeof difficulty_levels | ""
  >("");
  const [difficultyExplaination, setDifficultyExplaination] =
    useState<string>("");
  const [realism, setRealism] = useState<string>("");
  const [model, setModel] = useState("ChatGPT o3 Mini");
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [description, setDescription] = useState("");
  const [comments, setComments] = useState("");
  const [nonRestrictedProblem, setNonRestrictedProblem] = useState<boolean>(false);
  const validate = useMemo(() => {
    return !(title != "" && description != "" && nonRestrictedProblem);
  }, [title, description, nonRestrictedProblem]);
  const finish = async () => {
    try {
      const prompt_response = await fetch(
        import.meta.env.BASE_URL + "../api/preliminary_evaluation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            experiment_id: state.experiment_id,
            title: title,
            description: description,
            model: model,
            goal: goal,
            difficulty_explaination: difficultyExplaination,
            realism: realism,
            comments: comments,
            experience: {
              name: "experience",
              description:
                experience == "" ? "" : experience_levels[experience],
              level: experience,
            },
            reasoning_experience: {
              name: "reasoning_experience",
              description:
                reasoningExperience == ""
                  ? ""
                  : experience_levels[reasoningExperience],
              level: reasoningExperience,
            },
            difficulty: {
              name: "difficulty",
              description:
                difficulty == "" ? "" : difficulty_levels[difficulty],
              level: difficulty,
            },
          }),
        },
      );
      if (!prompt_response.ok) {
        throw new Error(prompt_response.statusText);
      }
      await prompt_response.json();
      finishSetup();
    } catch (error) {
      notifications.show({
        title: "failed to finish evaluation",
        message: `${error}`,
      });
    }
  };
  return (
    <>
      <h1>Problem Setup</h1>
      <Flex direction="column" gap="1ex">
      <Radio.Group
        value={experience}
        onChange={(e) => setExperience(e as keyof typeof experience_levels)}
        name="levelOfExperience"
        label="On average, what is your level of experience with knowledge AI systems such as ChatGPT 4o, Claude, LLama3, etc? If answering for a team, provide the level of experience of the most experienced team member."
      >
        {Object.entries(experience_levels).map(([k, v]) => (
          <Radio key={k} value={k} label={v} />
        ))}
      </Radio.Group>
      <Radio.Group
        value={reasoningExperience}
        onChange={(e) =>
          setReasoningExperience(e as keyof typeof experience_levels)
        }
        name="levelOfExperienceReasoning"
        label="On average, what is your level of experience with reasoning AI systems such as O1, O3, Gemini 2.0, Perplexity-Pro-Reasoning? If answering for a team, provide the level of experience of the most experienced team member."
      >
        {Object.entries(experience_levels).map(([k, v]) => (
          <Radio key={k} value={k} label={v} />
        ))}
      </Radio.Group>
      <Autocomplete
        clearable
        defaultValue="GPT o3 Mini"
        label="What model did you use?"
        data={["ChatGPT o3 Mini", "ChatGPT 4o"]}
        onChange={(e) => setModel(e)}
        value={model}
      />
      <TextInput
        label="Title for your experiment"
        onChange={(e) => setTitle(e.currentTarget.value)}
        value={title}
        required
      />
      <Textarea
        label="What is your overall research goal/objective for this experiment?"
        minRows={4}
        autosize
        onChange={(e) => setGoal(e.currentTarget.value)}
        value={goal}
      />
      <Textarea
        label="Describe the probem in a paragraph or more"
        minRows={4}
        autosize
        onChange={(e) => setDescription(e.currentTarget.value)}
        value={description}
        required
      />
      {state.allowScore ? (
        <Radio.Group
          value={difficulty}
          onChange={(e) => setDifficulty(e as keyof typeof difficulty_levels)}
          name="levelOfDifficulty"
          label="How would you describe the level of difficulty of the problem?"
        >
          {Object.entries(difficulty_levels).map(([k, v]) => (
            <Radio key={k} value={k} label={v} />
          ))}
        </Radio.Group>
      ) : (
        <></>
      )}
      <Textarea
        label="How would you describe the level of difficulty of the problem?"
        minRows={4}
        autosize
        onChange={(e) => setDifficultyExplaination(e.currentTarget.value)}
        value={difficultyExplaination}
      />
      <Textarea
        label="How realistic (true to life) is the problem you will work on today? "
        minRows={4}
        autosize
        onChange={(e) => setRealism(e.currentTarget.value)}
        value={realism}
      />
      <Textarea
        label="Please provide any additional information you consider relevant"
        minRows={4}
        autosize
        onChange={(e) => setComments(e.currentTarget.value)}
        value={comments}
      />
      <Checkbox
      label="I certify that this problem does not contain any restricted information or personally identifyiable information (PII)"
      checked={nonRestrictedProblem}
      onChange={(e) => setNonRestrictedProblem(e.currentTarget.checked)}
      />
      <Button onClick={finish} disabled={validate}>
        Start Prompting
      </Button>
      </Flex>
    </>
  );
}

interface FinalEvaluationProps {
  finishEvaluation: () => void;
  state: LabStyleState;
}

function FinalUnscoredEvaluation({ finishEvaluation, state }: FinalEvaluationProps) {
  const [strength, setStrength] = useState("");
  const [weakness, setWeakness] = useState("");
  const [dailyUse, setDailyUse] = useState("");
  const [eventImprovement, setEventImprovement] = useState("");
  const finish = async () => {
    try {
      const prompt_response = await fetch(
        import.meta.env.BASE_URL + "../api/final_evaluation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            experiment_id: state.experiment_id,
            overall: null,
            novelty: null,
            productivity: null,
            teamwork: null,
            completeness: null,
            productivity_improvement: null,

            event_improvement: eventImprovement,
            daily_use: dailyUse,
            main_strength: strength,
            main_weakness: weakness,
          }),
        },
      );
      if (!prompt_response.ok) {
        throw new Error(prompt_response.statusText);
      }
      await prompt_response.json();
      finishEvaluation();
      notifications.show({
        title: "All done!",
        message: `Would you like to do another?`,
      });
    } catch (error) {
      notifications.show({
        title: "failed to finish evaluation",
        message: `failed testing your question: ${error}`,
      });
    }
  };

  return (
    <>
      <h1>General Feedback</h1>
      <Textarea
        label="What is/are the main strength(s) of this model? Please provide a brief explanation for each strength mentioned."
        minRows={4}
        autosize
        onChange={(e) => setStrength(e.currentTarget.value)}
        value={strength}
      />
      <Textarea
        label="What is/are as the main weakness(es) of this model? Please provide a brief explanation for each weakness mentioned 
    "
        minRows={4}
        autosize
        onChange={(e) => setWeakness(e.currentTarget.value)}
        value={weakness}
      />
      <Textarea
        label="What, if anything, would need to be true for you to use this model on a daily basis?"
        minRows={4}
        autosize
        onChange={(e) => setDailyUse(e.currentTarget.value)}
        value={dailyUse}
      />
      <Textarea
        label="Any feedback on the event or these questions in this form? "
        minRows={4}
        autosize
        onChange={(e) => setEventImprovement(e.currentTarget.value)}
        value={eventImprovement}
      />
      <Button onClick={finish}>Finish</Button>
    </>
  );
}
function FinalEvaluation({ finishEvaluation, state }: FinalEvaluationProps) {
  const overall_levels = {
    staff:
      "Not having access to this capability would put us at a marked disadvantage relative to teams that have it.",
    postdoc:
      "Our contributions will be meaningfully better with this capability, but not to such a degree that there would be a stark contrast with otherwise equally capable teams that do not have access to it.",
    gradstudent: "We could take it or leave it.",
    student:
      "It’s hard to see this having much value, but it probably will not do any harm to have access to the capability.",
    public:
      "This capability is a distraction and would lower our contributions",
  };
  const novelty_levels = {
    staff:
      "The idea or solution leads to groundbreaking innovation or significantly expands on current knowledge presenting a novel approach",
    postdoc:
      "The idea offers a notable contribution to advancing current knowledge, providing a creative yet somewhat familiar soluon.",
    gradstudent:
      "The solution is somewhat innovative but doesn't present a strong novel element, building largely on existing ideas",
    student:
      "The solution is not particularly novel or creative, mostly reiterating known approaches with limited new insight.",
    public:
      "The solution lacks any novel contribution, adding nothing new to current understanding or practices",
  };
  const productivity_levels = {
    staff:
      "Demonstrates exceptional knowledge and leadership, contributing at a highly advanced level, mentoring others, and consistently driving the team’s success.",
    postdoc:
      "Shows a high level of expertise, frequently contributes valuable insights, and is a strong asset to the team with considerable collaboration and problem-solving skills.",
    gradstudent:
      "Contributes adequately to the team, demonstrating a solid understanding and providing reliable support with some ability to lead smaller tasks or initiatives.",
    student:
      "Contributions are inconsistent, with some gaps in knowledge or collaboration, requiring guidance from others and affecting the team’s overall performance.",
    public:
      "Shows minimal contribution, lacks the necessary skills or initiative, and requires significant oversight, hindering the team’s progress",
  };
  const teamwork_levels = {
    staff:
      "It would significantly enhance the team’s productivity by consistently optimizing workflows, driving efficiency, and removing bottlenecks.",
    postdoc:
      "It would noticeably improve productivity through reliable and effective contributions, facilitating the team’s ability to meet deadlines and goals.",
    gradstudent:
      "It would contribute adequately to productivity, supporting the team’s progress but without major improvements in speed or efficiency.",
    student:
      "Its impact on productivity would be minimal, occasionally contributing to delays or inefficiencies due to lack of timely support.",
    public:
      "It would negatively impact productivity, causing significant delays or inefficiencies, hindering the team’s ability to perform optimally.",
  };
  const completeness_levels = {
    staff:
      "The idea or solution is exceptional, well thought-out, and addresses all key challenges, with clear potential for success and application.",
    postdoc:
      "The idea or solution is strong, generally well thought-out, and addresses most key challenges effectively, with good potential for success.",
    gradstudent:
      "The idea or solution is acceptable, addressing some challenges, though with potential gaps or weaknesses.",
    student:
      "The idea or solution is weak, with several critical gaps or challenges that limit its feasibility or success potential.",
    public:
      "The idea or solution is poorly conceived, lacks coherence, and fails to address key challenges, with little chance of success.",
  };

  const [overall, setOverall] = useState<keyof typeof overall_levels | "">("");
  const [overallExplaination, setAdvantageExplaination] = useState("");

  const [productivity, setProductivity] = useState<
    keyof typeof productivity_levels | ""
  >("");
  const [productivityExplaination, setProductivityExplaination] = useState("");

  const [teamwork, setTeamwork] = useState<keyof typeof teamwork_levels | "">(
    "",
  );
  const [teamworkExplaination, setTeamworkExplaination] = useState("");

  const [novelty, setInnovation] = useState<keyof typeof novelty_levels | "">(
    "",
  );
  const [noveltyExplaination, setInnovationExplaination] = useState("");

  const [completeness, setCompleteness] = useState<
    keyof typeof completeness_levels | ""
  >("");
  const [completenessExplaination, setCompletenessExplaination] = useState("");

  const [assistance, setAssistance] = useState("");
  const [productivity_improvement, setProductivityImprovement] = useState("");
  const [event_improvement, setEventImprovement] = useState("");

  const finish = async () => {
    try {
      const prompt_response = await fetch(
        import.meta.env.BASE_URL + "../api/final_evaluation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            experiment_id: state.experiment_id,
            overall: {
              score: {
                name: "advantage",
                level: overall,
                description: overall != "" ? overall_levels[overall] : "",
              },
              justification: overallExplaination,
            },

            productivity: {
              score: {
                name: "productivity",
                level: productivity,
                description:
                  productivity != "" ? productivity_levels[productivity] : "",
              },
              justification: productivityExplaination,
            },

            teamwork: {
              score: {
                name: "teamwork",
                level: teamwork,
                description: teamwork != "" ? teamwork_levels[teamwork] : "",
              },
              justification: teamworkExplaination,
            },

            novelty: {
              score: {
                name: "novelty",
                level: novelty,
                description: novelty != "" ? novelty_levels[novelty] : "",
              },
              justification: noveltyExplaination,
            },

            completeness: {
              score: {
                name: "completeness",
                level: completeness,
                description:
                  completeness != "" ? completeness_levels[completeness] : "",
              },
              justification: completenessExplaination,
            },

            productivity_improvement: productivity_improvement,
            event_improvement: event_improvement,
            assistance: assistance,
          }),
        },
      );
      if (!prompt_response.ok) {
        throw new Error(prompt_response.statusText);
      }
      await prompt_response.json();
      finishEvaluation();
      notifications.show({
        title: "All done!",
        message: `Would you like to do another?`,
      });
    } catch (error) {
      notifications.show({
        title: "failed to finish evaluation",
        message: `failed testing your question: ${error}`,
      });
    }
  };

  return (
    <>
      <h1>General Feedback</h1>
      <Textarea
        label="What if any help was given by the event staff while using this model?"
        autosize
        minRows={4}
        value={assistance}
        onChange={(e) => setAssistance(e.currentTarget.value)}
      />
      <Radio.Group
        value={overall}
        onChange={(e) => setOverall(e as keyof typeof overall_levels)}
        name="advantage"
        label="Based on the model's performance today, How much of a comparative advantage would it be to have readily available access to this tool?"
      >
        {Object.entries(overall_levels).map(([k, v]) => (
          <Radio key={k} value={k} label={v} />
        ))}
      </Radio.Group>
      <Textarea
        label="Explain the selection for the previous question"
        autosize
        minRows={4}
        value={overallExplaination}
        onChange={(e) => setAdvantageExplaination(e.currentTarget.value)}
      />
      <Radio.Group
        value={novelty}
        onChange={(e) => setInnovation(e as keyof typeof novelty_levels)}
        name="innovation"
        label="Based on the performance on this problem, How innovative are responses from the model?"
      >
        {Object.entries(novelty_levels).map(([k, v]) => (
          <Radio key={k} value={k} label={v} />
        ))}
      </Radio.Group>
      <Textarea
        label="Explain the selection for the previous question"
        autosize
        minRows={4}
        value={noveltyExplaination}
        onChange={(e) => setInnovationExplaination(e.currentTarget.value)}
      />
      <Radio.Group
        value={productivity}
        onChange={(e) => setProductivity(e as keyof typeof productivity_levels)}
        name="productivity"
        label="Based on the models performance on this problem, The productivity and effectiveness of this model:"
      >
        {Object.entries(productivity_levels).map(([k, v]) => (
          <Radio key={k} value={k} label={v} />
        ))}
      </Radio.Group>
      <Textarea
        label="Explain your selection on the previous question"
        autosize
        minRows={4}
        value={productivityExplaination}
        onChange={(e) => setProductivityExplaination(e.currentTarget.value)}
      />
      <Radio.Group
        value={teamwork}
        onChange={(e) => setTeamwork(e as keyof typeof teamwork_levels)}
        name="teamwork"
        label="Based on the model’s performance on this problem, how much would the model to impact a team's productivity?"
      >
        {Object.entries(teamwork_levels).map(([k, v]) => (
          <Radio key={k} value={k} label={v} />
        ))}
      </Radio.Group>
      <Textarea
        label="Explain your selection on the previous question"
        autosize
        minRows={4}
        value={teamworkExplaination}
        onChange={(e) => setTeamworkExplaination(e.currentTarget.value)}
      />
      <Textarea
        label="What features or knowledge would increase the score on the previous two questions"
        autosize
        minRows={4}
        value={productivity_improvement}
        onChange={(e) => setProductivityImprovement(e.currentTarget.value)}
      />
      <Radio.Group
        value={completeness}
        onChange={(e) => setCompleteness(e as keyof typeof completeness_levels)}
        name="completeness"
        label="Based on the model's performance, how complete, correct, or plausible was the proposed solution?"
      >
        {Object.entries(completeness_levels).map(([k, v]) => (
          <Radio key={k} value={k} label={v} />
        ))}
      </Radio.Group>
      <Textarea
        label="Explain why your rating for the model's correctness, completeness, and plausibility"
        autosize
        minRows={4}
        value={completenessExplaination}
        onChange={(e) => setCompletenessExplaination(e.currentTarget.value)}
      />
      <Textarea
        label="Any feedback on the event or these questions?"
        autosize
        minRows={4}
        value={event_improvement}
        onChange={(e) => setEventImprovement(e.currentTarget.value)}
      />
      <Button onClick={finish}>finish evaluation</Button>
    </>
  );
}

interface SkillTabProps {
  tabName: string;
  skillLabel: string;
  skillValue: string;
  skillLevels: { [key: string]: string };
  setSkillValue: (v: any) => void;
  setSkillComment: (v: string) => void;
  skillComment: string;
  allowScore: boolean;
}

function SkillTab({
  tabName,
  skillLabel,
  skillValue,
  setSkillValue,
  skillComment,
  setSkillComment,
  skillLevels,
  allowScore,
}: SkillTabProps) {
  if (allowScore) {
    return (
      <Tabs.Panel value={tabName}>
        <Radio.Group
          value={skillValue}
          onChange={(e) => setSkillValue(e as keyof typeof skillLevels)}
          name={tabName}
          label={skillLabel}
        >
          {Object.entries(skillLevels).map(([k, v]) => (
            <Radio key={k} value={k} label={v} />
          ))}
        </Radio.Group>
        <Textarea
          label="Please assses the skill in a paragraph or more. Be specific about what the model did or didn't do"
          autosize
          minRows={4}
          value={skillComment}
          onChange={(e) => setSkillComment(e.currentTarget.value)}
        />
      </Tabs.Panel>
    );
  } else {
    return (
      <Tabs.Panel value={tabName}>
        <Text>{skillLabel} You may want to take inspiration from: </Text>
        <List>
          {Object.entries(skillLevels).map(([k, v]) => (
            <List.Item key={k}>{v}</List.Item>
          ))}
        </List>
        <Textarea
          label="Please assses the skill in a paragraph or more. Be specific about what the model did or didn't do"
          autosize
          minRows={4}
          value={skillComment}
          onChange={(e) => setSkillComment(e.currentTarget.value)}
        />
      </Tabs.Panel>
    );
  }
}

interface PromptingProps {
  nextPrompt: () => void;
  finishPrompting: () => void;
  state: LabStyleState;
}
function Prompting({ nextPrompt, finishPrompting, state }: PromptingProps) {
  const [goal, setGoal] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [tab, setTab] = useState<string | null>("intro");
  const [_promptHistory, setPromptHistory] = useState<string[]>([]);
  const [nonRestrictedProblem, setNonRestrictedProblem] = useState<boolean>(false);
  const updateHistory = useCallback(
    debounce((value: string) => {
      setPromptHistory((old) => {
        return [...old, value];
      });
    }, 5000),
    [],
  );
  const updatePrompt = (new_value: string) => {
    setPrompt(new_value);
    updateHistory(new_value);
  };

  const analysis_levels = {
    staff:
      "Provides profound analysis leading to new understandings or discoveries. Develops or applies innovative techniques. Results significantly influence the field. Analysis informs policy, practice, or sets new research agendas.",
    postdoc:
      "Performs sophisticated analysis revealing nuanced insights. Utilizes advanced methods and validates findings. Integrates results with theoretical frameworks. Critically evaluates significance and impact. ",
    gradstudent:
      "Conducts thorough analysis using appropriate tools. Accurately interprets results, relating them to research questions and literature. Acknowledges limitations and considers alternatives. Demonstrates critical thinking. ",
    student:
      "Performs basic analysis using standard methods. Identifies some findings but may miss deeper insights. May make calculation or reasoning errors. Restates results without significant insight. ",
    public:
      "Provides minimal or incorrect analysis. Misinterprets findings or fails to identify key patterns. Does not use appropriate methods. Overlooks anomalies or errors. ",
  };
  const conclusion_levels = {
    staff:
      "Delivers compelling conclusions redefining understanding of the topic. Articulates transformative impacts on the field. Writing is of publishable quality in prestigious journals. Conclusions influence research agendas and policy decisions. ",
    postdoc:
      "Crafts comprehensive conclusions integrating findings into broader discourse. Explores theoretical, practical implications in depth. Provides insightful recommendations for further study or practice.",
    gradstudent:
      "Draws clear, logical conclusions addressing objectives. Synthesizes findings and discusses significance within the field. Explores potential applications. Suggests areas for future research.",
    student:
      "Summarizes findings at a basic level. Conclusions may restate results without deeper insight. Limited discussion of significance or applications. Does not suggest future research directions. ",
    public:
      "Fails to draw meaningful conclusions or provides unsupported ones. Does not address hypotheses or objectives. Writing is unclear and disorganized. Overlooks broader implications.",
  };
  const hypothesis_levels = {
    staff:
      "Formulates innovative, groundbreaking hypotheses or questions challenging existing paradigms. Reflects profound understanding of the field's trajectory. Proposals are influential, setting new research directions and reshaping the discipline. ",
    postdoc:
      "Generates sophisticated hypotheses or questions addressing gaps or controversies. Shows creativity and deep theoretical understanding. Considers alternative outcomes and implications. Potential to advance knowledge significantly. ",
    gradstudent:
      "Constructs a clear, focused, and testable hypothesis or question grounded in literature. Demonstrates originality and relevance. Defines variables and anticipated relationships. Aligns with established theories and concepts. ",
    student:
      "Develops a basic hypothesis or question that addresses the problem superficially. May lack depth or originality. Testable but not well-aligned with theoretical frameworks. Requires refinement to clarify variables and scope. ",
    public:
      "Does not formulate a clear hypothesis or research question. Ideas are vague, unfocused, or untestable. Shows little connection to the problem or literature. Lacks originality and understanding of research fundamentals. ",
  };
  const understanding_levels = {
    staff:
      "Showcases exceptional insight into the problem. Connects it to a broad spectrum of theories and practices. Anticipates future challenges and opportunities. Contributes original thoughts that shape understanding within the field. Influences how the problem is perceived and addressed.",
    postdoc:
      "Demonstrates comprehensive and nuanced understanding. Clearly articulates complexities, interdependencies, and broader impacts. Identifies gaps in existing knowledge and potential areas for advancement. Employs critical thinking to question assumptions and explore alternative perspectives.",
    gradstudent:
      "Exhibits thorough understanding of the problem, including underlying mechanisms and contributing factors. Articulates the significance and context within the field. Recognizes complexities and explores interrelationships between concepts. Begins to consider potential challenges.",
    student:
      "Shows a basic grasp of the main aspects of the problem. Identifies primary issues but overlooks complexities and subtleties. Provides general explanations but may oversimplify critical elements. Requires guidance to comprehend deeper implications.",
    public:
      "Demonstrates minimal understanding of the research problem. Misinterprets key concepts and objectives. Fails to recognize the significance or relevance within the field. May confuse or conflate unrelated ideas.",
  };
  const planning_levels = {
    staff:
      "Designs an exemplary plan setting new field standards. Incorporates cutting-edge methods and technologies. Optimizes efficiency and effectiveness. May introduce novel methodologies influencing research practices. ",
    postdoc:
      "Crafts a comprehensive, methodologically sound plan integrating advanced techniques. Anticipates challenges and includes contingencies. Ensures rigorous adherence to ethical standards. Potential to yield significant, reliable results.",
    gradstudent:
      "Develops a detailed, logical plan. Includes appropriate methods, procedures, and resources. Identifies variables, controls, and limitations. Demonstrates understanding of ethical considerations and feasibility. ",
    student:
      "Outlines a basic plan with general procedures. Lacks detail and may overlook important variables or controls. Doesn't fully consider feasibility or ethics. Requires significant improvement to be viable.",
    public:
      "Provides no plan or an incoherent, impractical one. Fails to address methodological considerations. Omits critical components like objectives or procedures. Neglects ethical, practical, or logistical factors.",
  };
  const review_levels = {
    staff:
      "Exhibits exhaustive knowledge of the literature, including emerging and obscure works. Establishes connections across fields to provide innovative perspectives. The review contributes new insights or proposes novel frameworks. Influences future research directions through synthesis provided.",
    postdoc:
      "Delivers a comprehensive literature review, including foundational works and the latest research. Synthesizes information to identify inconsistencies and debates within the field. Integrates interdisciplinary sources where appropriate. Evaluates methodologies and theoretical frameworks critically.",
    gradstudent:
      "Provides a well-rounded review, referencing key studies and prominent authors. Utilizes appropriate collections to source relevant and credible rigorous articles. Critically assesses and synthesizes information from multiple sources. Identifies main themes and gaps in the literature.",
    student:
      "Includes a basic selection of literature using general sources. References some relevant works but misses significant studies. Shows limited ability to assess source credibility. Relies heavily on textbooks or secondary summaries instead of primary research articles.",
    public:
      "Presents minimal or irrelevant literature. Sources are outdated, non-rigorous, or inappropriate. Fails to include key studies or influential authors. Does not demonstrate understanding of the existing research landscape. ",
  };

  const [previousTurn, setPreviousTurn] = useState<number>(0);
  const [understanding, setUnderstanding] = useState<
    keyof typeof understanding_levels | ""
  >("");
  const [review, setReview] = useState<keyof typeof review_levels | "">("");
  const [hypothesis, setHypothesis] = useState<
    keyof typeof hypothesis_levels | ""
  >("");
  const [planning, setPlanning] = useState<keyof typeof planning_levels | "">(
    "",
  );
  const [analysis, setAnalysis] = useState<keyof typeof analysis_levels | "">(
    "",
  );
  const [conclusions, setConclusions] = useState<
    keyof typeof conclusion_levels | ""
  >("");
  const [understandingExplaination, setUnderstandingExplaination] =
    useState("");
  const [reviewExplaination, setReviewExplaination] = useState("");
  const [hypothesisExplaination, setHypothesisExplaination] = useState("");
  const [planningExplaination, setPlanningExplaination] = useState("");
  const [analysisExplaination, setAnalysisExplaination] = useState("");
  const [conclusionsExplaination, setConclusionsExplaination] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskAssessment, setTaskAssessment] = useState("");
  // TODO be sure to call updatePrompt.flush() before submission

  const submitPrompt = async () => {
    //first submit the old prompt
    try {
      const prompt_response = await fetch(
        import.meta.env.BASE_URL + "../api/experiment_turn",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            experiment_id: state.experiment_id,
            previous_turn: previousTurn,
            goal: goal,
            prompt: prompt,
            output: output,
            
            other_task: taskDescription,
            other_task_assessment: taskAssessment,

            analysis: {
              score: {
                name: "analysis",
                level: analysis,
                description: analysis != "" ? analysis_levels[analysis] : "",
              },
              justification: analysisExplaination,
            },

            conclusions: {
              score: {
                name: "conclusions",
                level: conclusions,
                description:
                  conclusions != "" ? conclusion_levels[conclusions] : "",
              },
              justification: conclusionsExplaination,
            },

            hypothesis: {
              score: {
                name: "hypothesis",
                level: hypothesis,
                description:
                  hypothesis != "" ? hypothesis_levels[hypothesis] : "",
              },
              justification: hypothesisExplaination,
            },

            planning: {
              score: {
                name: "planning",
                level: planning,
                description: planning != "" ? planning_levels[planning] : "",
              },
              justification: planningExplaination,
            },

            review: {
              score: {
                name: "review",
                level: review,
                description: review != "" ? review_levels[review] : "",
              },
              justification: reviewExplaination,
            },

            understanding: {
              score: {
                name: "understanding",
                level: understanding,
                description:
                  understanding != ""
                    ? understanding_levels[understanding]
                    : "",
              },
              justification: understandingExplaination,
            },
          }),
        },
      );
      if (!prompt_response.ok) {
        throw new Error(prompt_response.statusText);
      }
      const server_prompt_response_id: number = await prompt_response.json();

      //TODO handle file uploads
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("turnid", server_prompt_response_id.toString());
        const file_response = await fetch(
          import.meta.env.BASE_URL + "../api/experiment_file",
          {
            method: "POST",
            body: formData,
          },
        );
        if (!file_response.ok) {
          throw new Error(`file upload failed : ${file_response.statusText}`);
        }

        console.log(file);
      }

      setPreviousTurn(server_prompt_response_id);

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
      setTaskDescription("");
      setTaskAssessment("");
      setNonRestrictedProblem(false);
      setTab("intro");
      nextPrompt();
      notifications.show({
        title: "submitted turn",
        message: "on to the next one!",
      });
    } catch (error) {
      notifications.show({
        title: "failed to submit prompt evaluation",
        message: `${error}`,
      });
    }
  };

  const submitAndFinishPrompt = async () => {
    await submitPrompt();
    finishPrompting();
  };

  const [files, setFiles] = useState<File[]>([]);
  return (
    <Flex direction="column" gap="1em">
      <h1>Prompting</h1>
      <h2>First, think about your prompt</h2>
      <Textarea
        label="What is the goal of this prompt?"
        autosize
        minRows={4}
        value={goal}
        onChange={(e) => setGoal(e.currentTarget.value)}
      />
      <Textarea
        label="What is the prompt?"
        autosize
        minRows={4}
        value={prompt}
        onChange={(e) => updatePrompt(e.currentTarget.value)}
      />
      <FileInput
        label="Please upload files provided in the prompt if any"
        placeholder="Click to upload files"
        clearable
        multiple
        value={files}
        onChange={setFiles}
      />
      <h2>Run the prompt in the OpenAI Interface</h2>
      <Textarea
        label="Please copy and paste the output"
        autosize
        minRows={4}
        value={output}
        onChange={(e) => setOutput(e.currentTarget.value)}
      />
      <h2>What skill(s) did you explore with this prompt?</h2>
      <Tabs value={tab} onChange={setTab}>
        <Tabs.List>
          <Tabs.Tab value="intro">Introduction to Skills Evaluation</Tabs.Tab>
          <Tabs.Tab value="understanding">Problem Understanding</Tabs.Tab>
          <Tabs.Tab value="review">Literature Review</Tabs.Tab>
          <Tabs.Tab value="hypothesis">Hypothesis Generation</Tabs.Tab>
          <Tabs.Tab value="planning">Planning/Design</Tabs.Tab>
          <Tabs.Tab value="analysis">Result Analysis</Tabs.Tab>
          <Tabs.Tab value="conclusions">Generate Conclusions</Tabs.Tab>
          <Tabs.Tab value="other">Other Tasks</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="intro">
          <Text>
            Please explore any skills you think are appropriate for this
            response by clicking on the tabs for the skills you wish to explore.
            You may scores as many or as few as you like for each response. When
            you are finished, you can click "keep prompting" ask a new prompt or
            "finish" to move onto a new evaluation
          </Text>
        </Tabs.Panel>
        <SkillTab
          tabName="understanding"
          skillLabel="Now consider how well the model understands the problem. "
          skillValue={understanding}
          setSkillValue={setUnderstanding}
          skillComment={understandingExplaination}
          setSkillComment={setUnderstandingExplaination}
          skillLevels={understanding_levels}
          allowScore={state.allowScore}
        />
        <SkillTab
          tabName="review"
          skillLabel="Now consider how well the model can conduct a litrature search. "
          skillValue={review}
          setSkillValue={setReview}
          skillComment={reviewExplaination}
          setSkillComment={setReviewExplaination}
          skillLevels={review_levels}
          allowScore={state.allowScore}
        />
        <SkillTab
          tabName="hypothesis"
          skillLabel="Now consider how well the model can can generate hypothesis"
          skillValue={hypothesis}
          setSkillValue={setHypothesis}
          skillComment={hypothesisExplaination}
          setSkillComment={setHypothesisExplaination}
          skillLevels={hypothesis_levels}
          allowScore={state.allowScore}
        />
        <SkillTab
          tabName="planning"
          skillLabel="Now consider how well the model can plan experiments, observations, simulations, or code"
          skillValue={planning}
          setSkillValue={setPlanning}
          skillComment={planningExplaination}
          setSkillComment={setPlanningExplaination}
          skillLevels={planning_levels}
          allowScore={state.allowScore}
        />
        <SkillTab
          tabName="analysis"
          skillLabel="Now consider how well the model can analyze results"
          skillValue={analysis}
          setSkillValue={setAnalysis}
          skillComment={analysisExplaination}
          setSkillComment={setAnalysisExplaination}
          skillLevels={analysis_levels}
          allowScore={state.allowScore}
        />
        <SkillTab
          tabName="conclusions"
          skillLabel="Now consider how well the model can generate conclusions"
          skillValue={conclusions}
          setSkillValue={setConclusions}
          skillComment={conclusionsExplaination}
          setSkillComment={setConclusionsExplaination}
          skillLevels={conclusion_levels}
          allowScore={state.allowScore}
        />
        <Tabs.Panel value="other">
          <Textarea
            label="Please describe the task"
            autosize
            minRows={4}
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.currentTarget.value)}
          />
          <Textarea
            label="Please assses the skill in a paragraph or more"
            autosize
            minRows={4}
            value={taskAssessment}
            onChange={(e) => setTaskAssessment(e.currentTarget.value)}
          />
        </Tabs.Panel>
      </Tabs>
      <Checkbox
      label="I certify that this prompt does not contain any restricted information or personally identifyiable information (PII)"
      checked={nonRestrictedProblem}
      onChange={(e) => setNonRestrictedProblem(e.currentTarget.checked)}
      />
      <Button disabled={!nonRestrictedProblem} onClick={submitPrompt}>keep prompting</Button>
      <Button disabled={!nonRestrictedProblem} onClick={submitAndFinishPrompt}>finish</Button>
    </Flex>
  );
}

export function LabStyle() {
  const [authorInfo, setAuthorInfo] = useState<AuthorInfoCallbackData>({
    authorName: "",
    authorAffiliation: "",
    orcid: "",
    authorPosition: "",
    reviewerSkills: [],
  });
  const [experimentState, setExperimentState] = useState<LabStyleState>({
    mode: LabStyleStage.ProblemSetup,
    experiment_id: null,
    allowScore: false,
  });
  const [configured, setConfigured] = useState<boolean>(false);
  const reconfigure = () => {
    setConfigured(false);
  };
  const configureAuthor = async (authorInfo: AuthorInfoCallbackData) => {
    try {
      const author_response = await fetch(
        import.meta.env.BASE_URL + "../api/author",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: authorInfo.authorName,
            affilliation: authorInfo.authorAffiliation,
            position: authorInfo.authorPosition,
            orcid: authorInfo.orcid,
          }),
        },
      );
      if (!author_response.ok) {
        throw new Error(author_response.statusText);
      }
      const server_author_info: AuthorResponseSchema =
        await author_response.json();

      const experimentlog_response = await fetch(
        import.meta.env.BASE_URL + "../api/experimentlog",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            author_id: server_author_info.id,
          }),
        },
      );
      if (!experimentlog_response.ok) {
        throw new Error(experimentlog_response.statusText);
      }
      const server_experiment_id: number = await experimentlog_response.json();

      setAuthorInfo({
        authorName: server_author_info.name,
        authorAffiliation: server_author_info.affilliation,
        authorPosition: server_author_info.position,
        orcid: server_author_info.orcid || "",
        reviewerSkills: authorInfo.reviewerSkills,
      });
      setExperimentState({
        ...experimentState,
        experiment_id: server_experiment_id,
        mode: LabStyleStage.ProblemSetup,
      });
      setConfigured(true);
    } catch (error) {
      notifications.show({
        title: "failed to start experiment",
        message: `failed testing your question: ${error}`,
      });
    }
  };

  const finishSetup = () => {
    setExperimentState({ ...experimentState, mode: LabStyleStage.Prompting });
  };
  const nextPrompt = () => {
    setExperimentState({ ...experimentState, mode: LabStyleStage.Prompting });
  };
  const finishPrompting = () => {
    setExperimentState({
      ...experimentState,
      mode: LabStyleStage.FinalEvaluation,
    });
  };
  const finishEvaluation = () => {
    setExperimentState({
      ...experimentState,
      mode: LabStyleStage.ProblemSetup,
    });
  };

  let lab_form;
  switch (experimentState.mode) {
    case LabStyleStage.ProblemSetup:
      lab_form = (
        <ProblemSetup finishSetup={finishSetup} state={experimentState} />
      );
      break;
    case LabStyleStage.Prompting:
      lab_form = (
        <Prompting
          nextPrompt={nextPrompt}
          finishPrompting={finishPrompting}
          state={experimentState}
        />
      );
      break;
    case LabStyleStage.FinalEvaluation:
      if (experimentState.allowScore) {
        lab_form = (
          <FinalEvaluation
            finishEvaluation={finishEvaluation}
            state={experimentState}
          />
        );
      } else {
        lab_form = (
          <FinalUnscoredEvaluation
            finishEvaluation={finishEvaluation}
            state={experimentState}
          />
        );
      }
      break;
  }

  return (
    <>
      <HeaderSimple
        title="LabStyle Experiments"
        reconfigure={reconfigure}
        author={authorInfo.authorName}
      />
      <Container>
        {configured ? (
          lab_form
        ) : experimentState.allowScore == false ? (
          <AnonAuthorInfo
            authRequired={true}
            actionTitle="Experimenting"
            configureAuthor={configureAuthor}
            defaults={authorInfo}
          />
        ) : (
          <AuthorInfo
            authRequired={true}
            actionTitle="Experimenting"
            configureAuthor={configureAuthor}
            defaults={authorInfo}
          />
        )}
        <Notifications position="bottom-center" />
      </Container>
    </>
  );
}
