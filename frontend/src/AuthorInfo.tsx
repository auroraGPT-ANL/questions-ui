import { allowedDomains, allowedPositions } from "./API";
import { useGlobusAuth } from "@globus/react-auth-context";
import {
  Button,
  Flex,
  MultiSelect,
  TextInput,
  NativeSelect,
  Autocomplete,
} from "@mantine/core";
import "@mantine/core/styles.css";
import { useState, useMemo, useEffect } from "react";
import debounce from "lodash.debounce";

export interface AuthorInfoCallbackData {
  authorName: string;
  authorAffiliation: string;
  authorPosition: string;
  orcid: string;
  reviewerSkills: string[];
}
export interface AuthorInfoProps {
  configureAuthor: (authorInfo: AuthorInfoCallbackData) => void;
  defaults: AuthorInfoCallbackData;
  actionTitle: string;
  authRequired: boolean;
}

export function AuthorInfo({
  authRequired,
  actionTitle,
  configureAuthor: configureReviewer,
  defaults,
}: AuthorInfoProps) {
    let isAuthenticated: boolean;
    let defaultUserName: string;
    let defaultOrganization: string;
    let authorization: any;
  if(import.meta.env.VITE_USE_GLOBUS == "true") {
      const { isAuthenticated: isGlobusAuthenticated, authorization: globusAuthorization } = useGlobusAuth();
      isAuthenticated = isGlobusAuthenticated;
      authorization = globusAuthorization;
      defaultUserName =authorization?.user?.name!;
      defaultOrganization = authorization?.user?.organization!;
  } else {
      isAuthenticated = true;
      defaultUserName = "";
      defaultOrganization = "";
      authorization = null;
  }
  const [authorName, setAuthorName] = useState(defaults.authorName || "");
  const [authorPosition, setAuthorPosition] = useState(
    defaults.authorPosition || "",
  );
  const [authorAffiliation, setAuthorInstition] = useState(
    defaults.authorAffiliation || "",
  );
  const [orcid, setORCID] = useState(defaults.orcid || "");
  const [reviewerSkills, setReviewerSkills] = useState<string[]>(
    defaults.reviewerSkills || [],
  );
  const [affiliations, setAffiliations] = useState<string[]>([]);

  //login should initialize name and affiliation if they are not setup
  useEffect(() => {
    if (isAuthenticated && defaults.authorName === "" && authorName === "") {
      if(import.meta.env.VITE_USE_GLOBUS === "true") {
          setAuthorName(defaultUserName);
      }
    }
    if (
      isAuthenticated &&
      defaults.authorAffiliation === "" &&
      authorAffiliation === ""
    ) {
      setAuthorInstition(defaultOrganization);
    }
  }, [isAuthenticated, authorization, defaults, authorAffiliation, authorName]);

  const readyToReview = useMemo(() => {
    if (authorName === "") return false;
    if (authorAffiliation === "") return false;
    if (reviewerSkills.length === 0) return false;
    if (authRequired && !isAuthenticated) return false;
    return true;
  }, [
    authorName,
    authorAffiliation,
    reviewerSkills,
    authorPosition,
    authRequired,
    isAuthenticated,
  ]);

  const configure = () => {
    configureReviewer({
      authorName: authorName,
      authorAffiliation: authorAffiliation,
      authorPosition: authorPosition,
      orcid: orcid,
      reviewerSkills: reviewerSkills,
    });
  };
  useEffect(() => {
    const fn = debounce(async () => {
      if (authorAffiliation.length >= 2) {
        const response = await (authorAffiliation == ""
          ? fetch(import.meta.env.BASE_URL + "../api/affiliations")
          : fetch(
              import.meta.env.BASE_URL +
                `../api/affiliations?q=${authorAffiliation}`,
            ));
        const affiliations = await response.json();
        setAffiliations(affiliations);
      }
    });
    fn();
  }, [authorAffiliation]);

  const positionElem = useMemo(() => {
    return (
      <NativeSelect
        required
        value={authorPosition}
        onChange={(e) => setAuthorPosition(e.currentTarget.value)}
        label="Position"
        data={
          authorPosition
            ? allowedPositions.map((pos) => ({ value: pos, label: pos }))
            : [
                { value: "", label: "Select position", disabled: true },
                ...allowedPositions.map((pos) => ({ value: pos, label: pos })),
              ]
        }
        styles={() => ({
          input: {
            color: authorPosition ? "black" : "rgb(173, 181, 189)",
            "&:not(:focus):invalid": {
              color: "rgb(173, 181, 189)",
            },
          },
          item: {
            "&[data-disabled]": {
              color: "rgb(173, 181, 189)",
            },
            "&:not([data-disabled])": {
              color: "black",
            },
          },
        })}
      />
    );
  }, [authorPosition, allowedPositions, setAuthorPosition]);

  const skillsElem = useMemo(() => {
    return (
      <MultiSelect
        required
        value={reviewerSkills}
        onChange={setReviewerSkills}
        label="Domains"
        data={allowedDomains}
        searchable
        placeholder="What domains are you familar with?"
      />
    );
  }, [reviewerSkills, allowedDomains, setReviewerSkills]);

  const affiliationElem = useMemo(() => {
    return (
      <Autocomplete
        required
        value={authorAffiliation}
        onChange={setAuthorInstition}
        label="Affiliation"
        placeholder="What is your primary affiliation? e.g. Argonne National Laboratory"
        data={affiliations}
      />
    );
  }, [authorAffiliation, affiliations]);

  return authRequired && !isAuthenticated ? (
    <>
    {
      (import.meta.env.VITE_USE_GLOBUS==="true")?
      (<><h1>Globus Authentication is Now Required to Author Questions</h1>
      <button onClick={async () => await authorization?.login()}>login</button></>):
          (<><h1>Authorization Disabled</h1></>)
    }
    </>
  ) : (
    <>
      <Flex direction="column">
        <TextInput
          required
          value={authorName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setAuthorName(e.currentTarget.value);
          }}
          label="Name"
          placeholder="What is your name?"
        />
        {affiliationElem}
        <TextInput
          value={orcid}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setORCID(e.currentTarget.value);
          }}
          label="ORCID"
          placeholder="What is your ORCID if you have one? XXXX-XXXX-XXXX-XXXX"
        />
        {positionElem}
        {skillsElem}
        <Button
          disabled={!readyToReview}
          onClick={(_e: React.MouseEvent) => {
            configure();
          }}
        >
          start {actionTitle.toLowerCase()}
        </Button>
      </Flex>
    </>
  );
}
