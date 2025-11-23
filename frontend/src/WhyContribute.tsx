// WhyContribute.jsx
import { useState } from "react";
import { Container, Text, Collapse } from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";

export function WhyContributeDropdown() {
  const [opened, setOpened] = useState(false);

  const toggleOpen = () => {
    setOpened((prev) => !prev);
  };

  return (
    <div>
      <Text
        style={{
          cursor: "pointer",
          fontStyle: "italic",
          fontWeight: "bold",
          color: "black",
        }}
        onClick={toggleOpen}
      >
        {opened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}{" "}
        Why contribute?
      </Text>
      <Collapse in={opened}>
        <WhyContribute />
        <Text
          style={{
            cursor: "pointer",
            fontStyle: "italic",
            fontWeight: "bold",
            color: "black",
            marginTop: "1rem",
          }}
          onClick={toggleOpen}
        >
          <IconChevronUp size={16} /> Close
        </Text>
      </Collapse>
    </div>
  );
}

function WhyContribute() {
  return (
    <Container
      style={{
        borderLeft: "1.5px gray solid",
        borderTop: "none",
        borderRight: "none",
        borderBottom: "none",
        padding: "0 1rem", // Adjust the padding as needed
      }}
    >
      <div>
        {/* <h1>Why Contribute?</h1> */}
        <h3>Personal benefits </h3>
        <h4 style={{ fontStyle: "italic", marginBottom: "-5pt" }}>
          Earn recognition for your contributions to the benchmark
        </h4>
        <p>
          Question authors with 20 quality MCQ contributions (for 2024) to the
          benchmark will be recognized in the acknowledgments of papers authored
          by our team on the benchmark or via public recognition systems, such
          as ORCID, which are used to publicly log contributions to the
          community. Question authors with extensive high-quality contributions
          (50 for 2024) will be invited to join the team to be co-authors of
          papers by our team and help guide the evaluation.
        </p>
        <h4 style={{ fontStyle: "italic", marginBottom: "-5pt" }}>
          Ensure that your research topic is better supported by AI models.
        </h4>
        <p>
          Because this benchmark is intended to be used by AI model developers
          to improve the performance of their models, by contributing questions
          representing your research area, you can ensure that your scientific
          domain/perspectives/interests/focus are represented.
        </p>
        <h3>Laboratories/Universities/Research Institution benefits</h3>
        <h4 style={{ fontStyle: "italic", marginBottom: "-5pt" }}>
          Access to generated MCQs
        </h4>
        <p>
          Institutions will be able to download contributions from their
          researchers. Moreover, any domestic (USA) public research institution
          with considerable contributions to the benchmark (500 MCQs for 2024),
          will be able to access the benchmark MCQs subject to the signature of
          an MOU between Argonne National Laboratory and the institution.
          International public research institutions signatory of a current MOU
          with Argonne National Laboratory and with considerable contributions
          to the benchmark (500 MCQs for 2024), will be able to access the
          benchmark MCQs. Any other public institution will be able to use the
          benchmark on ALCF (Argonne Laboratory Computing Facility) machines
          subject to existing terms of use for ALCF.
        </p>
        <h4 style={{ fontStyle: "italic", marginBottom: "-5pt" }}>
          Access to MCQ analysis toolkit
        </h4>
        <p>
          Educational and Research institutions with significant contributions
          to the benchmark (200 MCQs for 2024) will be able to access the
          analysis toolkit of the benchmark. This access that will be available
          in fall 2024 will allow researchers and students to perform
          statistical analysis on the generated MCQs. The analysis toolkit will
          allow the selection of MCQs by institution and the analysis of AI
          model responses. Education institutions can use this tool as a way to
          easily determine which exam questions are likely solvable by
          state-of-the-art Foundation Models.
        </p>
        <h4 style={{ fontStyle: "italic", marginBottom: "-5pt" }}>
          Shared infrastructure and development effort
        </h4>
        <p>
          Argonne has already developed a high-quality question authoring
          platform that facilitates the creation, testing, and validation of the
          questions to encourage high-quality submissions and is working on a
          first-class set of diagnostic tools to evaluate submitted questions.
          Institutions with a certain number of high-quality contributors will
          be given priority feedback mechanisms to improve the
          question-authoring form and diagnostics tools.
        </p>
        <h3>Scientific community benefits</h3>
        <h4 style={{ fontStyle: "italic", marginBottom: "-5pt" }}>
          AI will inevitably profoundly change the research practice, perhaps
          much more than the Internet did
        </h4>
        <p>
          For that to happen AI research assistants need to be trustworthy and
          safe. The only way to assess these two traits is to develop evaluation
          methods assessing the scientific skills, integrity, and safety of AI
          research assistants.
        </p>
        <h4 style={{ fontStyle: "italic", marginBottom: "-5pt" }}>
          The AI4Science benchmark is developed by researchers for researchers
        </h4>
        <p>
          By contributing to the AI4Science benchmark, you help the whole
          community of researchers progress toward faster and more effective
          research that will address society's most critical problems, such as
          addressing climate change, fighting cancer, solving water crises, and
          avoiding or dwarfing epidemics.
        </p>
        <h4 style={{ fontStyle: "italic", marginBottom: "-5pt" }}>
          Why we cannot rely only on existing benchmarks?
        </h4>
        <p>
          Benchmarks developed to evaluate general language skills and knowledge
          of LLMs are not built with research tasks in mind. They do not include
          enough diverse and difficult questions relevant to researchers.
          Moreover, many existing benchmarks have been leaked into LLM training
          used by commercial models to improve their scores. This is called
          contamination.
        </p>
        <h4 style={{ fontStyle: "italic", marginBottom: "-5pt" }}>
          Why develop a benchmark specifically for science?
        </h4>
        <p>
          Without relevant/rigorous/precise/comprehensive evaluation, there is
          no way to measure quantitatively the strengths and weaknesses of
          foundation models. Only evaluation can tell us what skills are strong
          and which ones are weak and need reinforcement. Moreover, rigorous
          evaluation is an important tool for comparing models. Common
          benchmarks lead to the competition (current LLMs race), which
          accelerates progress.
        </p>
        <h4 style={{ fontStyle: "italic", marginBottom: "-5pt" }}>
          Progressive openness
        </h4>
        <p>
          It is critical for the quality of AI model evaluation that the
          benchmark is not included in the training of AI models. This is why
          the benchmark is not fully open to the public as questions are added.
          The benchmark MCQs will be released progressively, as more MCQs are
          generated and as AI models succeed in answering MCQs. We are
          considering an MCQ release once a year. Full access is possible via
          the signature of an institutional NDA for public research institutions
          with considerable contributions to the benchmarks.
        </p>
      </div>
    </Container>
  );
}

export default WhyContribute;
