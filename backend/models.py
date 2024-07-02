from sqlalchemy import create_engine, Table, ForeignKey, Column, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Mapped, sessionmaker, relationship, mapped_column
from typing import List,Optional

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

class Position(Base):
    __tablename__ = "position"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)
    
class Affiliation(Base):
    __tablename__ = "affiliation"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)

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
    name: Mapped[str] = mapped_column()
    orcid: Mapped[Optional[str]] = mapped_column(unique=True)
    affiliation_id: Mapped[int] = mapped_column(ForeignKey("affiliation.id"))
    affiliation: Mapped[Affiliation] = relationship()
    position_id: Mapped[int] = mapped_column(ForeignKey("position.id"))
    position: Mapped[Position] = relationship()

class Review(Base):
    __tablename__ = "review"
    id: Mapped[int] = mapped_column(primary_key=True)
    author_id = mapped_column(ForeignKey("author.id"))
    author: Mapped[Author] = relationship()
    question_id: Mapped[int] = mapped_column(ForeignKey("question.id"))
    question: Mapped[Question] = relationship()
    questionrelevent: Mapped[int] = mapped_column()
    questionfromarticle: Mapped[int] = mapped_column()
    questionindependence: Mapped[int] = mapped_column()
    questionchallenging: Mapped[int] = mapped_column()
    answerrelevent: Mapped[int] = mapped_column()
    answercomplete: Mapped[int] = mapped_column()
    answerfromarticle: Mapped[int] = mapped_column()
    answerunique: Mapped[int] = mapped_column()
    answeruncontroverial: Mapped[int] = mapped_column()
    arithmaticfree: Mapped[int] = mapped_column()
    skillcorrect: Mapped[int] = mapped_column()
    domaincorrect: Mapped[int] = mapped_column()
    comments: Mapped[str] = mapped_column()
    modified: Mapped[DateTime] = mapped_column(default=func.now())
    accept: Mapped[bool] = mapped_column()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

