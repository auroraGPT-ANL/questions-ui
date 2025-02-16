from typing import Optional
from schemas import CreateAuthorSchema, CreateReviewSchema, CreateQuestionSchema, ReviewerSchema, ContributionsSchema, CreateAiSkillSchema, CreateJustifiedAiSkill
from models import Author, Affiliation, Review, Question, Skill, Domain, Difficulty, Position, Distractor, Review, domains_to_questions, Skips, AiSkill, AiSkillCategory, ExperimentTurnEvaluation
from sqlalchemy import or_, and_, text, bindparam, func
from sqlalchemy.orm import Session, joinedload

def create_or_select_skill_category(db: Session, skill_name: str) -> AiSkillCategory:
    item = db.query(AiSkillCategory).filter(AiSkillCategory.name == skill_name).first()
    if item is None:
        item = AiSkillCategory(name=skill_name)
        db.add(item)
        db.commit()
        db.refresh(item)
    return item

def create_or_select_skill(db: Session, skill: CreateAiSkillSchema) -> AiSkill:
    skill_category = create_or_select_skill_category(db, skill.name).id
    item = db.query(AiSkill).filter(AiSkill.description == skill.description, AiSkill.level == skill.level, AiSkill.skill_category_id == skill_category).first()
    if item is None:
        item = AiSkill(
            description=skill.name,
            level=skill.level,
            skill_category_id = skill_category
        )
        db.add(item)
        db.commit()
        db.refresh(item)
    return item

def create_justified_skill(db: Session, experiment_turn_id: int, just_skill: CreateJustifiedAiSkill) -> int:
    skill = create_or_select_skill(db, just_skill.score)
    turn_eval = ExperimentTurnEvaluation(
        turn_id = experiment_turn_id,
        skill_id = skill.id,
        skill_comments = just_skill.justification
    )
    db.add(turn_eval)
    db.commit()
    db.refresh(turn_eval)
    return turn_eval.id


def insert_or_select(db: Session, EntityType, text: str):
    item = db.query(EntityType).filter(EntityType.name == text).first()
    if item is None:
        item = EntityType(name=text)
        db.add(item)
        db.commit()
        db.refresh(item)
    return item

def create_or_select_author(db: Session, author: CreateAuthorSchema|int) -> Author:
    if isinstance(author,int):
        db_author = db.query(Author).filter(Author.id==author).first()
        if db_author is None:
            raise KeyError(f"Author {author} not found")
        return db_author
    else:
        affiliation=insert_or_select(db, Affiliation, author.affilliation)
        position=insert_or_select(db, Position, author.position)
        if author.orcid != "":
            db_author = db.query(Author).filter(or_(and_(Author.name==author.name,
                                                         Author.affiliation==affiliation,
                                                         Author.position==position)
                                                    ,
                                                    Author.orcid==author.orcid)).first()
        else:
            db_author = db.query(Author).filter(and_(Author.name==author.name,
                                                         Author.affiliation==affiliation,
                                                         Author.position==position)
                                                    ).first()

        if db_author is None:
            db_author = Author(
                    name = author.name,
                    orcid = author.orcid if author.orcid != "" else None,
                    affiliation = affiliation,
                    position = position
                    )
            db.add(db_author)
            db.commit()
            db.refresh(db_author)
        return db_author
def create_question(db: Session, question: CreateQuestionSchema) -> Question:
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
        author=create_or_select_author(db, question.author),
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question

def list_questions(db: Session, skip: int = 0, limit: int = 100, author_id: Optional[int] = None, query: Optional[str] = None, ids: Optional[list[int]] = None) -> list[Question]:
    q = db.query(Question).options(
            joinedload(Question.author),
            joinedload(Question.difficulty),
            joinedload(Question.distractors),
            joinedload(Question.skills),
            joinedload(Question.domains)
           )
    if query is not None:
        q = q.filter(Question.question.ilike(f"%{query}%"))
    if author_id is not None:
        q = q.filter(Question.author_id == author_id)
    if ids is not None:
        q = q.filter(Question.id.in_(ids))
    return q.offset(skip).limit(limit).all()


def create_review(db: Session, review: CreateReviewSchema) -> Review:
    r = Review(
        author=create_or_select_author(db, review.author),
        question_id=review.question_id,
        questionrelevent=review.questionrelevent,
        questionfromarticle=review.questionfromarticle,
        questionindependence=review.questionindependence,
        questionchallenging=review.questionchallenging,
        answerrelevent=review.answerrelevent,
        answercomplete=review.answercomplete,
        answerfromarticle=review.answerfromarticle,
        answerunique=review.answerunique,
        answeruncontroverial=review.answeruncontroverial,
        arithmaticfree=review.arithmaticfree,
        skillcorrect=review.skillcorrect,
        domaincorrect=review.domaincorrect,
        comments=review.comments,
        accept=review.accept,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return r

def select_review_batch(db: Session, reviewer: ReviewerSchema, limit: int, validations: int):
    domain_ids = db.query(Domain.id).filter(Domain.name.in_(reviewer.domains)).subquery()
    author = create_or_select_author(db, reviewer.author)
    skips = db.query(Skips.c.question_id).filter(Skips.c.author_id != author.id).subquery()
    to_review = (db.query(Question.id)
        .outerjoin(Review, Review.question_id == Question.id)
        .outerjoin(domains_to_questions, domains_to_questions.c.question_id == Question.id)
        .filter(
            Question.author_id != author.id,
            domains_to_questions.c.question_id.in_(domain_ids),
            Question.id.not_in(skips)
            )
        .group_by(Question.id)
        .having(func.count(Review.id) < validations)
        .order_by(func.random())
        .limit(limit)
    ).all()
    return to_review

def validated_questions(db: Session, validations: int) -> list[Question]:
    if validations > 0:
        reviewed = db.query(Review.question_id).group_by(Review.question_id).having(func.count(Review.question_id) >= validations).all()
        return db.query(Question).options(
                joinedload(Question.author),
                joinedload(Question.difficulty),
                joinedload(Question.distractors),
                joinedload(Question.skills),
                joinedload(Question.domains)
               ).filter(Question.id.in_(reviewed)).all()
    else:
        return db.query(Question).options(
                joinedload(Question.author),
                joinedload(Question.difficulty),
                joinedload(Question.distractors),
                joinedload(Question.skills),
                joinedload(Question.domains)
               ).all()

def contributions(db: Session, author_id: int, validations: int = 3) -> ContributionsSchema:
    num_questions: int = (
            db.query(func.count(Question.id))
            .filter(Question.author_id == author_id)
            .scalar() or 0)
    validated_ids = db.query(Review.question_id).join(Question, Review.question_id == Question.id).filter(Question.author_id == author_id).group_by(Review.question_id).having(func.count(Review.question_id) >= validations).all()
    print(validated_ids)
    num_validated = len(validated_ids)
    num_reviews: int = (
            db.query(func.count(Review.id))
            .filter(Review.author_id == author_id)
            .scalar() or 0)
    print(num_questions, num_validated, num_reviews)

    return ContributionsSchema(
            num_questions=num_questions,
            num_validated=num_validated,
            num_reviews=num_reviews
    )
