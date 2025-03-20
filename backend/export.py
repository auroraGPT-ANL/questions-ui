#!/usr/bin/env python
from pydantic import BaseModel, Field
from typing import Optional

class JamVersion(BaseModel):
    version: str = Field(default="1.1.0")

class JamSkill(BaseModel):
    name: str
    assessment: str

class JamFiles(BaseModel):
    id: int
    turn_id: int
    path: str

class JamTurn(BaseModel):
    id: int
    previous_turn: int = Field(default=0)
    experiment_id: int
    model: Optional[str] = Field(default=None) # if not null default model
    output: str = Field(default="")
    goal: str = Field(default="")
    prompt: str = Field(default="")
    skill_assessments: list[JamSkill] = Field(default_factory=list) # the tool default skills were ["hypotheis", "analysis", "review", "conclusions", "planning"]
                                      # if your site has different skills collected (e.g. clarity), prefer these instead
                                      # the order of skills are arbitrary
    other_task: str = Field(default="")
    other_task_assessment: str = Field(default="")
    files_url: list[str] = Field(default_factory=list)# if files are subject to copyright, remove from files array and provide one URL per file
    files: list[JamFiles] = Field(default_factory=list)# the files for your site that are not Copyright concerns

    #new in version 1.1.0
    data_removed: bool = Field(default=False) # if the data was removed because it could NOT be replaced with a URL
                                              # (e.g. because of a security or copyright review), mark this as True


class JamExperiment(BaseModel):
    id: int
    #from the initial assessment
    title: str = Field(default="")
    description: str = Field(default="")
    model: Optional[str] = Field(default=None) # default model if the experiment turn does not have a model
    ai_experience: str= Field(default="")
    reasoning_experience: str= Field(default="")
    realism: str= Field(default="")
    difficulty_explaination: str= Field(default="")
    goal: str= Field(default="")
    comments: str= Field(default="")
    #from the final assessment
    main_strength: str= Field(default="")
    main_weakness: str= Field(default="")
    daily_use: str= Field(default="")
    productivity_improvement: str= Field(default="")
    event_improvement: str= Field(default="")
    # the prompt/output pairs
    turns: list[JamTurn] = Field(default_factory=list)

class JamExport(BaseModel):
    version: JamVersion
    experiments: list[JamExperiment]

if __name__ == "__main__":
    import json
    import argparse
    from pydantic import ValidationError
    parser = argparse.ArgumentParser()
    parser.add_argument("file", type=argparse.FileType('r'))
    args = parser.parse_args()
    try:
        JamExport(**json.load(args.file))
    except ValidationError as e:
        print("validation error", e.json())

