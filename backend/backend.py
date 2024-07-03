import asyncio
from fastapi import FastAPI, Depends, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session
from typing import Optional, Tuple
import starlette.status as status
from models import *
from schemas import *
from data_access import *
from ai import test_question_impl

app = FastAPI()
app.mount("/ui", StaticFiles(directory="ui"), name="ui")

@app.get("/")
def homepage(request: Request):
    return RedirectResponse(url=request.scope.get("root_path", "") + "/ui/index.html", status_code=status.HTTP_302_FOUND)

@app.post("/api/author", response_model=int)
def store_author(author: CreateAuthorSchema, db: Session = Depends(get_db)):
    a = create_or_select_author(db, author)
    return a.id

@app.get("/api/author", response_model=list[AuthorSchema])
def list_authors(db: Session = Depends(get_db), limit:int=100, skip:int=0):
    return [AuthorSchema(
                id=i.id,
                name=i.name,
                position=i.position,
                affiliation=i.affiliation,
                orcid=i.orcid,
            ) for i in db.query(Author).offset(skip).limit(limit).all()]

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
            author=q.author.id,
            support=q.support,
            comments=q.comments,
            )


@app.get("/api/review", response_model=list[ReviewSchema])
def list_reviews(limit:int=100, skip:int=0, db: Session =Depends(get_db)):
    return [ReviewSchema(
        id=r.id,
        author=r.author,
        question_id=r.question_id,
        questionrelevent=r.questionrelevent,
        questionfromarticle=r.questionfromarticle,
        questionindependence=r.questionindependence,
        questionchallenging=r.questionchallenging,
        answerrelevent=r.answerrelevent,
        answercomplete=r.answercomplete,
        answerfromarticle=r.answerfromarticle,
        answerunique=r.answerunique,
        answeruncontroverial=r.answeruncontroverial,
        arithmaticfree=r.arithmaticfree,
        skillcorrect=r.skillcorrect,
        domaincorrect=r.domaincorrect,
        comments=r.comments,
        accept=r.accept,
    ) for r in db.query(Review).limit(limit).offset(skip).all()]

@app.get("/api/review/{review_id}", response_model=ReviewSchema)
def get_review(review_id:int, db: Session =Depends(get_db)):
    r = db.query(Review).filter(Review.id == review_id).first()
    if r is not None:
        return ReviewSchema(
            id=r.id,
            author=r.author,
            question_id=r.question_id,
            questionrelevent=r.questionrelevent,
            questionfromarticle=r.questionfromarticle,
            questionindependence=r.questionindependence,
            questionchallenging=r.questionchallenging,
            answerrelevent=r.answerrelevent,
            answercomplete=r.answercomplete,
            answerfromarticle=r.answerfromarticle,
            answerunique=r.answerunique,
            answeruncontroverial=r.answeruncontroverial,
            arithmaticfree=r.arithmaticfree,
            skillcorrect=r.skillcorrect,
            domaincorrect=r.domaincorrect,
            comments=r.comments,
            accept=r.accept,
        ) 
    else:
        KeyError(f"Review {review_id} is not found")

@app.put("/api/review/{review_id}", response_model=ReviewSchema)
def update_review(review_id:int, review: CreateReviewSchema, db: Session =Depends(get_db)):
    r,*_ = db.execute(select(Review).where(Review.id == review_id)).scalar_one()
    if r is not None:
        r.questionrelevent=review.questionrelevent,
        r.questionfromarticle=review.questionfromarticle,
        r.questionindependence=review.questionindependence,
        r.questionchallenging=review.questionchallenging,
        r.answerrelevent=review.answerrelevent,
        r.answercomplete=review.answercomplete,
        r.answerfromarticle=review.answerfromarticle,
        r.answerunique=review.answerunique,
        r.answeruncontroverial=review.answeruncontroverial,
        r.arithmaticfree=review.arithmaticfree,
        r.skillcorrect=review.skillcorrect,
        r.domaincorrect=review.domaincorrect,
        r.comments=review.comments,
        r.accept=review.accept,
        db.add(r)
        db.commit()
        db.refresh(r)
        return ReviewSchema(
            id=r.id,
            author=r.author,
            question_id=r.question_id,
            questionrelevent=r.questionrelevent[0],
            questionfromarticle=r.questionfromarticle[0],
            questionindependence=r.questionindependence[0],
            questionchallenging=r.questionchallenging[0],
            answerrelevent=r.answerrelevent[0],
            answercomplete=r.answercomplete[0],
            answerfromarticle=r.answerfromarticle[0],
            answerunique=r.answerunique[0],
            answeruncontroverial=r.answeruncontroverial[0],
            arithmaticfree=r.arithmaticfree[0],
            skillcorrect=r.skillcorrect[0],
            domaincorrect=r.domaincorrect[0],
            comments=r.comments[0],
            accept=r.accept[0],
        ) 
    else:
        KeyError(f"Review {review_id} is not found")


@app.post("/api/review", response_model=ReviewSchema)
def store_review(review: CreateReviewSchema, db: Session =Depends(get_db)):
    r = create_review(db, review)
    return ReviewSchema(
        id=r.id,
        author=r.author,
        question_id=r.question_id,
        questionrelevent=r.questionrelevent,
        questionfromarticle=r.questionfromarticle,
        questionindependence=r.questionindependence,
        questionchallenging=r.questionchallenging,
        answerrelevent=r.answerrelevent,
        answercomplete=r.answercomplete,
        answerfromarticle=r.answerfromarticle,
        answerunique=r.answerunique,
        answeruncontroverial=r.answeruncontroverial,
        arithmaticfree=r.arithmaticfree,
        skillcorrect=r.skillcorrect,
        domaincorrect=r.domaincorrect,
        comments=r.comments,
        accept=r.accept,
    )


@app.get("/api/question", response_model=list[QuestionSchema])
def get_questions(db: Session = Depends(get_db), skip:int=0, limit:int=100, q:Optional[str]=None):
    return [QuestionSchema(
                id=i.id,
                question=i.question,
                correct_answer=i.correct_answer,
                distractors=[d.text for d in i.distractors],
                skills=[s.name for s in i.skills],
                domains=[d.name for d in i.domains],
                difficulty=i.difficulty.name,
                doi=i.doi,
                author=i.author,
                support=i.support,
                comments=i.comments,
            )
            for i in list_questions(db, skip, limit, query=q)]


@app.post("/api/review_batch", response_model=list[int])
def get_review_batch(reviewer: ReviewerSchema, db: Session = Depends(get_db), limit:int=10):
    return [r.id for r in select_review_batch(db, reviewer, limit)]

@app.post("/api/test_question", response_model=list[QuestionEvalSchema])
async def test_question(question: CreateQuestionSchema):
    results: list[Tuple[str, asyncio.Task[Tuple[bool, float, str, str]]]] = []
    async with asyncio.TaskGroup() as tg:
        for model in ["Llama2-7B", "Mistral-7B", "Llama3-8B"]:
            results.append((model, tg.create_task(test_question_impl(model, question.question, question.correct_answer, question.distractors))))
    return [QuestionEvalSchema(model=m, score=t.result()[1], correct=t.result()[0], corectlogprobs=t.result()[2], incorrectlogprobs=t.result()[3]) for (m,t) in results]
