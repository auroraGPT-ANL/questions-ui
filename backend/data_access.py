from typing import Optional
from schemas import CreateAuthorSchema, CreateReviewSchema, CreateQuestionSchema, ReviewerSchema
from models import Author, Affiliation, Review, Question, Skill, Domain, Difficulty, Position, Distractor, Review, domains_to_questions
from sqlalchemy import or_, and_, text, bindparam
from sqlalchemy.orm import Session

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
        db_author = db.query(Author).filter(or_(and_(Author.name==author.name,
                                                     Author.affiliation==affiliation,
                                                     Author.position==position)
                                                ,
                                                Author.orcid==author.orcid)).first()
        if db_author is None:
            db_author = Author(
                    name = author.name,
                    orcid = author.orcid,
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

def list_questions(db: Session, skip: int = 0, limit: int = 100, query: Optional[str] = None) -> list[Question]:
    if query is None:
        return db.query(Question).offset(skip).limit(limit).all()
    else:
        return db.query(Question).filter(Question.question.ilike(f"%{query}%")).offset(skip).limit(limit).all()


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

def select_review_batch(db: Session, reviewer: ReviewerSchema, limit: int):
    print("start select review_batch")
    domain_ids = [i.id for i in db.query(Domain).filter(Domain.name.in_(reviewer.domains)).all()]
    print("got domains")
    author = create_or_select_author(db, reviewer.author)
    print("got author")
    to_review = db.execute(text("""
                                SELECT question.id FROM question
                                LEFT JOIN review ON review.question_id == question.id
                                LEFT JOIN domains_to_questions ON question.id == domains_to_questions.question_id
                                WHERE
                                    question.author_id != :author_id 
                                    AND domains_to_questions.domain_id IN :domains 
                                GROUP BY question.id
                                HAVING COUNT(review.id) < 3
                                ORDER BY RANDOM()
                                LIMIT :limit
                                """).bindparams(
                                    bindparam("author_id"),
                                    bindparam("domains", expanding=True),
                                    bindparam("limit")
                                ),
                           {
                               "author_id": author.id,
                               "domains": domain_ids,
                               "limit": limit
                           }).fetchall()
    print("got review", to_review)
    return to_review
