from datetime import datetime
from sqlalchemy import create_engine, Table, ForeignKey, Column, func, DateTime, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, sessionmaker, relationship, mapped_column
from typing import List,Optional

SQLALCHEMY_DATABASE_URL = "sqlite:///questions.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

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

Skips = Table("skips",
                            Base.metadata,
                            Column("author_id", ForeignKey("author.id"), primary_key=True),
                            Column("question_id", ForeignKey("question.id"), primary_key=True),
                            Column("modified", DateTime, default=func.now(), nullable=False),
                            UniqueConstraint('question_id', 'author_id')
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
    modified: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

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
    __table_args__ = (
        UniqueConstraint('name', 'affiliation_id', 'position_id', name='ct_author_info_unique'),
    )

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
    modified: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    accept: Mapped[bool] = mapped_column()

class AiExperienceLevel(Base):
    __tablename__ = "ai_experience_level"
    id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str] = mapped_column()

class AuthorExperience(Base):
    __tablename__ = "author_experience"
    id: Mapped[int] = mapped_column(primary_key=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("author.id"))
    author: Mapped[Author] = relationship()
    ai_experience_level_id: Mapped[int] = mapped_column(ForeignKey("ai_experience_level.id"))
    ai_experience_level: Mapped[AiExperienceLevel] = relationship()

class AiSkillCategory(Base):
    __tablename__ = "ai_skill_category"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)

class AiSkill(Base):
    __tablename__ = "ai_skill"
    id: Mapped[int] = mapped_column(primary_key=True)
    description: Mapped[str] = mapped_column()
    skill_category_id: Mapped[int] = mapped_column(ForeignKey("ai_skill_category.id"))
    skill_category: Mapped[AiSkillCategory] = relationship()
    level: Mapped[str] = mapped_column()

class FinalEvaluation(Base):
    __tablename__ = "final_evaluation"
    id: Mapped[int] = mapped_column(primary_key=True)
    overall_id: Mapped[Optional[int]] = mapped_column(ForeignKey("ai_skill.id"))
    novelty_id: Mapped[Optional[int]] = mapped_column(ForeignKey("ai_skill.id"))
    productivity_id: Mapped[Optional[int]] = mapped_column(ForeignKey("ai_skill.id"))
    teamwork_id: Mapped[Optional[int]] = mapped_column(ForeignKey("ai_skill.id"))
    completeness_id: Mapped[Optional[int]] = mapped_column(ForeignKey("ai_skill.id"))

    overall_justification: Mapped[str] = mapped_column()
    novelty_justification: Mapped[str] = mapped_column()
    productivity_justification: Mapped[str] = mapped_column()
    teamwork_justification: Mapped[str] = mapped_column()
    completeness_justification: Mapped[str] = mapped_column()
    productivity_improvement: Mapped[str] = mapped_column()
    event_improvement: Mapped[str] = mapped_column()

    daily_use: Mapped[str] = mapped_column(server_default="")
    main_strength: Mapped[str] = mapped_column(server_default="")
    main_weakness: Mapped[str] = mapped_column(server_default="")

    overall: Mapped[AiSkill] = relationship(foreign_keys=[overall_id])
    novelty: Mapped[AiSkill] = relationship(foreign_keys=[novelty_id])
    productivity: Mapped[AiSkill] = relationship(foreign_keys=[productivity_id])
    teamwork: Mapped[AiSkill] = relationship(foreign_keys=[teamwork_id])
    completeness: Mapped[AiSkill] = relationship(foreign_keys=[completeness_id])


class PreliminaryEvaluation(Base):
    __tablename__ = "preliminary_evaluation"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[str] = mapped_column()
    model: Mapped[str] = mapped_column()
    experience_id: Mapped[str] = mapped_column(ForeignKey("ai_skill.id"))
    reasoning_experience_id: Mapped[Optional[int]] = mapped_column(ForeignKey("ai_skill.id"))
    difficulty_id: Mapped[int] = mapped_column(ForeignKey("ai_skill.id"))

    experience: Mapped[AiSkill] = relationship(foreign_keys=[experience_id])
    reasoning_experience: Mapped[AiSkill] = relationship(foreign_keys=[experience_id])
    difficulty: Mapped[AiSkill] = relationship(foreign_keys=[difficulty_id])
    difficulty_explaination: Mapped[str] = mapped_column(server_default="")
    realism: Mapped[str] = mapped_column(server_default="")
    goal: Mapped[str] = mapped_column(server_default="")
    comments: Mapped[str] = mapped_column(server_default="")

class ExperimentLog(Base):
    __tablename__ = "experiment_log"
    id: Mapped[int] = mapped_column(primary_key=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("author.id"))
    preliminary_evaluation_id: Mapped[Optional[int]] = mapped_column(ForeignKey("preliminary_evaluation.id"))
    final_evaluation_id: Mapped[Optional[int]] = mapped_column(ForeignKey("final_evaluation.id"))

    author: Mapped[Optional[Author]] = relationship()
    final_evaluation: Mapped[Optional[FinalEvaluation]] = relationship()

class ExperimentTurn(Base):
    __tablename__ = "experiment_turn"
    id: Mapped[int] = mapped_column(primary_key=True)
    experiment_id: Mapped[int] = mapped_column(ForeignKey("experiment_log.id"))
    previous_turn_id: Mapped[Optional[int]] = mapped_column(ForeignKey("experiment_turn.id"), nullable=True)
    output: Mapped[str] = mapped_column()
    goal: Mapped[str] = mapped_column()
    prompt: Mapped[str] = mapped_column()
    other_task: Mapped[str] = mapped_column(server_default="")
    other_task_assessment: Mapped[str] = mapped_column(server_default="")

    experiment: Mapped[ExperimentLog] = relationship()
    previous_turn: Mapped[Optional["ExperimentTurn"]] = relationship(remote_side=[id])

class ExperimentTurnEvaluation(Base):
    __tablename__ = "experiment_turn_evaluation"
    id: Mapped[int] = mapped_column(primary_key=True)
    turn_id: Mapped[int] = mapped_column(ForeignKey("experiment_turn.id"))
    skill_id: Mapped[int] = mapped_column(ForeignKey("ai_skill.id"))
    skill_comments: Mapped[str] = mapped_column(nullable=False)

    turn: Mapped[ExperimentTurn] = relationship()
    skill: Mapped[AiSkill] = relationship()

class ExperimentTurnFiles(Base):
    __tablename__ = "experiment_turn_files"
    id: Mapped[int] = mapped_column(primary_key=True)
    turn_id: Mapped[int] = mapped_column(ForeignKey("experiment_turn.id"))
    file_path: Mapped[str] = mapped_column()

    turn: Mapped[ExperimentTurn] = relationship()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

