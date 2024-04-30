import asyncio
from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Mapped, sessionmaker, relationship, mapped_column , Session
from sqlalchemy import ForeignKey, Column
from typing import List,Optional,Tuple
import starlette.status as status

SQLALCHEMY_DATABASE_URL = "sqlite:///questions.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

skills_to_questions = Table("skills_to_questions",
                            Base.metadata,
                            Column("skill_id", ForeignKey("skill.id"), primary_key=True),
                            Column("question_id", ForeignKey("question.id"), primary_key=True)
                            )

domains_to_questions = Table("domains_to_questions",
                            Base.metadata,
                            Column("domain_id", ForeignKey("domain.id"), primary_key=True),
                            Column("question_id", ForeignKey("question.id"), primary_key=True)
                            )

class Question(Base):
    __tablename__ = "question"
    id: Mapped[int] = mapped_column(primary_key=True)
    question: Mapped[str]
    correct_answer: Mapped[str]
    doi: Mapped[str]
    support: Mapped[str]
    comments: Mapped[str]
    distractors: Mapped[List["Distractor"]] = relationship()
    difficulty_id: Mapped[int] = mapped_column(ForeignKey("difficulty.id"))
    difficulty: Mapped["Difficulty"] = relationship()
    skills: Mapped[List["Skill"]] = relationship(secondary=skills_to_questions)
    domains: Mapped[List["Domain"]] = relationship(secondary=domains_to_questions)
    author_id: Mapped[int] = mapped_column(ForeignKey("author.id"))
    author: Mapped["Author"] = relationship()

class Distractor(Base):
    __tablename__ = "distractor"
    id: Mapped[int] = mapped_column(primary_key=True)
    text: Mapped[str]
    question_id: Mapped[int] = mapped_column(ForeignKey("question.id"))

class Skill(Base):
    __tablename__ = "skill"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)

class Domain(Base):
    __tablename__ = "domain"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)

class Difficulty(Base):
    __tablename__ = "difficulty"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)

class Author(Base):
    __tablename__ = "author"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)



class CreateQuestionSchema(BaseModel):
    question: str
    correct_answer: str
    distractors: list[str]
    skills: list[str]
    domains: list[str]
    difficulty: str
    doi: str
    author: str
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
    author: str
    support: str = ""
    comments: str = ""
    class Config:
        from_attributes = True
class QuestionEvalSchema(BaseModel):
    model: str
    score: float
    correct: bool
    class Config:
        from_attributes = True

def insert_or_select(db: Session, Type, text: str):
    item = db.query(Type).filter(Type.name == text).first()
    if item is None:
        item = Type(name=text)
        db.add(item)
        db.commit()
        db.refresh(item)
    return item

def create_question(db: Session, question: CreateQuestionSchema):
    db_question = Question(
        question=question.question,
        correct_answer=question.correct_answer,
        distractors=[Distractor(text=d) for d in question.distractors],
        skills=[insert_or_select(db, Skill, s) for s in question.skills],
        domains=[insert_or_select(db, Domain, d) for d in question.domains],
        difficulty=insert_or_select(db, Difficulty, question.difficulty),
        doi=question.doi,
        support=question.support,
        comments=question.comments,
        author=insert_or_select(db, Author, question.author)
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question

def list_questions(db: Session, skip: int = 0, limit: int = 100, query: Optional[str] = None) -> list[Question]:
    if query is None:
        return db.query(Question).offset(skip).limit(limit).all()
    else:
        return db.query(Question).filter(Question.question.ilike(f"%{query}%")).offset(skip).limit(limit).all()


Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI()
app.mount("/ui", StaticFiles(directory="ui"), name="ui")

@app.get("/")
def homepage():
    return RedirectResponse(url="/ui/index.html", status_code=status.HTTP_302_FOUND)

@app.post("/api/question", response_model=QuestionSchema)
def store_question(question: CreateQuestionSchema, db: Session = Depends(get_db)):
    q = create_question(db, question)
    return QuestionSchema(
            id=q.id,
            question=q.question,
            correct_answer=q.correct_answer,
            distractors=[d.text for d in q.distractors],
            skills=[s.name for s in q.skills],
            domains=[d.name for d in q.domains],
            difficulty=q.difficulty.name,
            doi=q.doi,
            author=q.author.name,
            support=q.support,
            comments=q.comments,
            )

@app.get("/api/question", response_model=list[QuestionSchema])
def get_questions(db: Session = Depends(get_db), skip:int=0, limit:int=100, q:Optional[str]=None):
    return [QuestionSchema(
                id=q.id,
                question=q.question,
                correct_answer=q.correct_answer,
                distractors=[d.text for d in q.distractors],
                skills=[s.name for s in q.skills],
                domains=[d.name for d in q.domains],
                difficulty=q.difficulty.name,
                doi=q.doi,
                author=q.author.name,
                support=q.support,
                comments=q.comments,
            )
            for q in list_questions(db, skip, limit, query=q)]

async def test_question_impl(
        api_base_url: str,
        model: str,
        question: str,
        correct_answer: str,
        incorrect_answers: List[str],
        ) -> Tuple[bool,float]:
    await asyncio.sleep(1)
    return False, 0.0

@app.post("/api/test_question", response_model=list[QuestionEvalSchema])
async def test_question(question: CreateQuestionSchema):
    api_base_url = ""
    results: list[Tuple[str, asyncio.Task[Tuple[bool, float]]]] = []
    async with asyncio.TaskGroup() as tg:
        for model in ["lamma2:7b", "mistral:7b"]:
            results.append((model, tg.create_task(test_question_impl(api_base_url, model, question.question, question.correct_answer, question.distractors))))
    return [QuestionEvalSchema(model=m, score=t.result()[1], correct=t.result()[0]) for (m,t) in results]
    

