from typing import Optional
from pydantic import BaseModel

class History(BaseModel):
    id: int
    question: str
    approved: bool
class CreateAuthorSchema(BaseModel):
    name: str
    affilliation: str
    position: str = ""
    orcid: Optional[str] = None
    class Config:
        from_attributes = True
class ReviewerSchema(BaseModel):
    author: CreateAuthorSchema|int
    domains: list[str]
    class Config:
        from_attributes = True
class CreateReviewSchema(BaseModel):
    author: CreateAuthorSchema|int
    question_id: int
    questionrelevent: int
    questionfromarticle: int
    questionindependence: int
    questionchallenging: int
    answerrelevent: int
    answercomplete: int
    answerfromarticle: int
    answerunique: int
    answeruncontroverial: int
    arithmaticfree: int
    skillcorrect: int
    domaincorrect: int
    comments: str
    accept: bool
    class Config:
        from_attributes = True
class ReviewSchema(BaseModel):
    id: int
    author: CreateAuthorSchema|int
    question_id: int
    questionrelevent: int
    questionfromarticle: int
    questionindependence: int
    questionchallenging: int
    answerrelevent: int
    answercomplete: int
    answerfromarticle: int
    answerunique: int
    answeruncontroverial: int
    arithmaticfree: int
    skillcorrect: int
    domaincorrect: int
    comments: str
    accept: bool
    class Config:
        from_attributes = True
class AuthorSchema(BaseModel):
    id: int
    name: str
    affilliation: str = ""
    position: str = ""
    orcid: Optional[str] = None
    class Config:
        from_attributes = True
class CreateQuestionSchema(BaseModel):
    question: str
    correct_answer: str
    distractors: list[str]
    skills: list[str]
    domains: list[str]
    difficulty: str
    doi: str
    author: CreateAuthorSchema|int
    support: str = ""
    comments: str = ""
    class Config:
        from_attributes = True
class QuestionSchema(BaseModel):
    id: Optional[int] = None
    question: str
    correct_answer: str
    distractors: list[str]
    skills: list[str]
    domains: list[str]
    difficulty: str
    doi: str
    author: int|CreateAuthorSchema
    support: str = ""
    comments: str = ""
    class Config:
        from_attributes = True
class QuestionEvalSchema(BaseModel):
    model: str
    score: float
    correct: bool
    corectlogprobs: str
    incorrectlogprobs: str
    class Config:
        from_attributes = True
