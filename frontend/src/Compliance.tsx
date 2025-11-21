import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import {
  Anchor,
  Checkbox,
} from "@mantine/core";
import {
    personallyIdentifiablePolicyLink,
    confidentialInformationPolicyLink,
    exportControlPolicyLink,
} from "./Config.tsx";

interface ComplianceProps {
    nonRestrictedProblem: boolean
    setNonRestrictedProblem: (arg0: boolean) => void
}

export function ComplianceCheckBox({nonRestrictedProblem, setNonRestrictedProblem}: ComplianceProps) {
      return (<Checkbox
      label={
        <>
            I certify to the best of my knowledge that this problem does not contain any {' '}
                <Anchor href={confidentialInformationPolicyLink} target="_blank">controlled unclassified information</Anchor> , {' '}
                <Anchor href={exportControlPolicyLink} target="_blank">information subject to export controls</Anchor> or {' '}
                <Anchor href={personallyIdentifiablePolicyLink} target="_blank">personally identifiable information (PII) </Anchor>
        </>
      }
      checked={nonRestrictedProblem}
      onChange={(e) => setNonRestrictedProblem(e.currentTarget.checked)}
      />)
}
