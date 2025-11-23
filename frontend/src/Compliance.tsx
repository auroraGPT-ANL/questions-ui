import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import {
  Anchor,
  Checkbox,
} from "@mantine/core";

interface ComplianceProps {
    nonRestrictedProblem: boolean
    setNonRestrictedProblem: (arg0: boolean) => void
}
export function ComplianceCheckBox({nonRestrictedProblem, setNonRestrictedProblem}: ComplianceProps) {
      return (<Checkbox
      label={
        <>
            I certify to the best of my knowledge that this problem does not contain any {' '}
                <Anchor href="https://www.energy.gov/sites/default/files/2024-08/science-technology-risk-matrix-unclassified.pdf" target="_blank">controlled unclassified information</Anchor> , {' '}
                <Anchor href="https://anl.app.box.com/s/g0bbjqeyrxfrgezsrzpbxpwbvkhlpf0z" target="_blank">information subject to export controls</Anchor> or {' '}
                <Anchor href="https://my.anl.gov/article/protecting-personally-identifiable-information-pii" target="_blank">personally identifiable information (PII) </Anchor>
        </>
      }
      checked={nonRestrictedProblem}
      onChange={(e) => setNonRestrictedProblem(e.currentTarget.checked)}
      />)
}
