import asyncio
from fastapi import FastAPI, Depends, Request, Query, HTTPException, Header, UploadFile, File, Form
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse, FileResponse
from sqlalchemy.orm import Session
import sqlalchemy as sa
from typing import Optional, Annotated
import starlette.status as status
from models import *
from schemas import *
from data_access import *
from ai import test_question_impl, eval_result
from pprint import pprint
import uuid
import config

FILES_PATH = Path("files")
FILES_PATH.mkdir(exist_ok=True)

app = FastAPI()
# UI static files and routes
app.mount("/ui/assets/", StaticFiles(directory="ui/assets"), name="ui")


@app.get("/ui/", response_class=FileResponse, include_in_schema=False)
@app.get("/ui/{path:path}", response_class=FileResponse, include_in_schema=False)
def authoring(_: Request, path: Optional[Path] = None):
    print(path)
    if path == Path("favicon.svg"):
        return FileResponse("ui/favicon.svg")
    else:
        return FileResponse("ui/index.html")

@app.get("/", response_class=RedirectResponse, include_in_schema=False)
def root(request: Request):
    return RedirectResponse(url=request.scope.get("root_path", "") + "/ui", status_code=status.HTTP_302_FOUND)

# API Routes

@app.post("/api/author", response_model=AuthorSchema)
def store_author(author: CreateAuthorSchema, db: Session = Depends(get_db)):
    a = create_or_select_author(db, author)
    return AuthorSchema(
            id=a.id,
            name=a.name,
            position=a.position.name,
            affilliation=a.affiliation.name,
            orcid=a.orcid
            )

@app.get("/api/author", response_model=list[AuthorSchema])
def list_authors(db: Session = Depends(get_db), limit:int=100, skip:int=0):
    return [AuthorSchema(
                id=i.id,
                name=i.name,
                position=i.position.name,
                affilliation=i.affiliation.name,
                orcid=i.orcid,
            ) for i in db.query(Author).offset(skip).limit(limit).all()]

@app.get("/api/author/{id}", response_model=AuthorSchema)
def get_author(id: int, db: Session = Depends(get_db)):
    i = db.query(Author).get(id)
    if i is None:
        raise KeyError(f"author {id} not found")
    return AuthorSchema(
                id=i.id,
                name=i.name,
                position=i.position.name,
                affilliation=i.affiliation.name,
                orcid=i.orcid,
            )


@app.get("/api/positions", response_model=list[str])
def list_positions(db: Session = Depends(get_db), q:str="", limit:int=100, skip:int=0):
    if q == "":
        return [i.name for i in db.query(Position.name).filter(Position.name != "").offset(skip).limit(limit).all()]
    else:
        return [i.name for i in db.query(Position.name).filter(Position.name.ilike(f"%{q.strip()}%")).offset(skip).limit(limit).all()]

@app.get("/api/affiliations", response_model=list[str])
def list_affiliations(db: Session = Depends(get_db), q:str="", limit:int=100, skip:int=0):
    if q == "":
        return [i.name for i in db.query(Affiliation.name).filter(Affiliation.name != "").offset(skip).limit(limit).all()]
    else:
        return [i.name for i in db.query(Affiliation.name).filter(Affiliation.name.ilike(f"%{q.strip()}%")).offset(skip).limit(limit).all()]

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

@app.get("/api/question", response_model=list[QuestionSchema])
def get_questions(db: Session = Depends(get_db), author_id: Optional[int] = None, skip:int=0, limit:int=100, q:Optional[str]=None, ids: Annotated[list[int] | None, Query()] = None):
    return [QuestionSchema(
                id=i.id,
                question=i.question,
                correct_answer=i.correct_answer,
                distractors=[d.text for d in i.distractors],
                skills=[s.name for s in i.skills],
                domains=[d.name for d in i.domains],
                difficulty=i.difficulty.name,
                doi=i.doi,
                author=i.author.id,
                support=i.support,
                comments=i.comments,
            )
            for i in list_questions(db, skip, limit, author_id=author_id, query=q, ids=ids)]

@app.get("/api/question/{id}", response_model=QuestionSchema)
def get_question(id :int, db: Session = Depends(get_db)):
    i = db.query(Question).options(
            joinedload(Question.author),
            joinedload(Question.distractors),
            joinedload(Question.domains),
            joinedload(Question.skills),
            joinedload(Question.difficulty)
            ).get(id)
    if i is None:
        raise KeyError(f"question {id} is not found")
    return QuestionSchema(
                id=i.id,
                question=i.question,
                correct_answer=i.correct_answer,
                distractors=[d.text for d in i.distractors],
                skills=[s.name for s in i.skills],
                domains=[d.name for d in i.domains],
                difficulty=i.difficulty.name,
                doi=i.doi,
                author=i.author.id,
                support=i.support,
                comments=i.comments,
            )

@app.get("/api/review", response_model=list[ReviewSchema])
def list_reviews(limit:int=100, reviewer_id:Optional[int]=None, question_id:Optional[int]=None, skip:int=0, db: Session =Depends(get_db)):
    query  = db.query(Review)
    if reviewer_id is not None:
        query = query.filter(Review.author_id == reviewer_id)
    if question_id is not None:
        query = query.filter(Review.question_id == question_id)
    query = query.limit(limit).offset(skip).all()
    return [ReviewSchema(
        id=r.id,
        author=r.author.id,
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
    ) for r in query]

@app.get("/api/review/{review_id}", response_model=ReviewSchema)
def get_review(review_id:int, db: Session =Depends(get_db)):
    r = db.query(Review).get(review_id)
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
    r = db.query(Review).get(review_id)
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


@app.post("/api/skip")
def skip_review(skip_request: SkipSchema, db: Session =Depends(get_db)):
    author = create_or_select_author(db, skip_request.author)
    try:
        db.execute(Skips.insert().values(author_id=author.id, question_id=skip_request.question_id))
        db.commit()
    except sa.exc.IntegrityError:
        #ignore attempts to insert the same skip multiple times
        pass


@app.post("/api/review", response_model=ReviewSchema)
def store_review(review: CreateReviewSchema, db: Session =Depends(get_db)):
    r = create_review(db, review)
    return ReviewSchema(
        id=r.id,
        author=r.author.id,
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

@app.get("/api/reviewhistory/{author_id}", response_model=list[History])
def reviewer_history(author_id: int, db: Session = Depends(get_db), limit:int=10, skip:int=0):
    reviews = (db.query(Review.id, sa.case((Review.accept == True, 'approved'),
                                          else_='rejected').label("accept"),
                       Question.question.label("question"),
                       Review.question_id.label("question_id"),
                       Review.modified.label("modified"))
                       .join(Question, Question.id == Review.question_id)
                       .filter(Review.author_id == author_id)
               )
    skips = (db.query(sa.sql.null(),
                     sa.sql.literal('skip').label("skipped"),
                     Question.question.label("question"),
                     Skips.c.question_id.label("question_id"),
                     Skips.c.modified.label("modified"))
             .join(Question, Question.id == Skips.c.question_id)
             .filter(Skips.c.author_id == author_id)
             )
    history = reviews.union_all(skips).order_by(sa.desc('modified')).limit(limit).offset(skip).all()

    return [History(
                question_id=h.question_id,
                review_id=h.id,
                question=h.question,
                action=h.accept,
                modified=h.modified
            ) for h in history]

@app.get("/api/reports/validated", response_model=list[QuestionSchema])
def reported_validated_questions(validations:int =3, db: Session = Depends(get_db)):
    return [
        QuestionSchema(
                            id=i.id,
                            question=i.question,
                            correct_answer=i.correct_answer,
                            distractors=[d.text for d in i.distractors],
                            skills=[s.name for s in i.skills],
                            domains=[d.name for d in i.domains],
                            difficulty=i.difficulty.name,
                            doi=i.doi,
                            author=i.author.id,
                            support=i.support,
                            comments=i.comments,
                        )
        for i in validated_questions(db, validations)
    ]


@app.get("/api/contributions/{author_id}", response_model=ContributionsSchema)
def get_contributions(author_id : int, validations: int = 3, db: Session = Depends(get_db)):
    return contributions(db, author_id, validations=validations)

@app.post("/api/review_batch", response_model=list[int])
def get_review_batch(reviewer: ReviewerSchema, db: Session = Depends(get_db), limit:int=10, validations:int = 1):
    return [r.id for r in select_review_batch(db, reviewer, limit, validations)]

@app.post("/api/test_question", response_model=list[QuestionEvalSchema])
async def test_question(question: CreateQuestionSchema, authorization: Annotated[str, Header()]):
    api_key = authorization.split(":")[1].strip()
    results: list[asyncio.Task[eval_result]] = []
    try:
        async with asyncio.TaskGroup() as tg:
            for model in ["Llama3-8B", "Llama3-70B", "Qwen2.5-14B", "Qwen2.5-7B"]:
                results.append(tg.create_task(test_question_impl(model, question.question, question.correct_answer, question.distractors, api_key)))
        task_results: list[eval_result] = [t.result() for t in results]
        return [QuestionEvalSchema(model=t.model, score=t.score, correct=t.is_correct, corectlogprobs=t.correct_log_str, incorrectlogprobs=t.incorrect_log_str) for t in task_results]
    except TimeoutError as e:
        err_msgs = []
        for i in e.exceptions:
            err_msgs.append(repr(i))
        raise HTTPException(status_code=503, detail="\n".join(err_msgs))

        

@app.get("/api/status", response_model=StatusSchema)
def get_status():
    #todo check if inference backend is online and serving requests
    # if it is not yet started, this api should request a start
    return StatusSchema(
        authoring= SystemStatus.ready if config.BACKEND_READY else SystemStatus.disabled
    )


@app.get("/api/experimentlog/{experiment_id}", response_model=ExperimentLogSchema)
def get_experiment(experiment_id: int, db: Session = Depends(get_db)):
    experiment = db.query(ExperimentLog).filter(ExperimentLog.id == experiment_id).first()
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return experiment


@app.post("/api/experimentlog", response_model=int)
def create_experiment(experiment: CreateExperimentLogSchema, db: Session = Depends(get_db)):
    new_experiment = ExperimentLog(
        author_id=experiment.author_id,
    )
    db.add(new_experiment)
    db.commit()
    db.refresh(new_experiment)
    return new_experiment.id


@app.get("/api/experiment_turn/{turn_id}", response_model=ExperimentTurnSchema)
def get_experiment_turn(turn_id: int, db: Session = Depends(get_db)):
    turn = db.query(ExperimentTurn).filter(ExperimentTurn.id == turn_id).first()
    if not turn:
        raise HTTPException(status_code=404, detail="Turn not found")
    return turn


@app.post("/api/experiment_turn", response_model=int)
def create_experiment_turn(turn: CreateExperimentTurnSchema, db: Session = Depends(get_db)):
    new_turn = ExperimentTurn(
        experiment_id=turn.experiment_id,
        previous_turn_id=turn.previous_turn,
        goal=turn.goal,
        prompt=turn.prompt,
        output=turn.output,
        other_task=turn.other_task,
        other_task_assessment=turn.other_task_assessment,
    )
    db.add(new_turn)
    db.commit()
    db.refresh(new_turn)

    create_justified_skill(db, new_turn.id, turn.hypothesis)
    create_justified_skill(db, new_turn.id, turn.analysis)
    create_justified_skill(db, new_turn.id, turn.review)
    create_justified_skill(db, new_turn.id, turn.conclusions)
    create_justified_skill(db, new_turn.id, turn.planning)


    return new_turn.id


@app.get("/api/skills/{skill_id}", response_model=AiSkillSchema)
def get_skill(skill_id: int, db: Session = Depends(get_db)):
    skill = db.query(AiSkill).filter(AiSkill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill


@app.post("/api/skills", response_model=int)
def create_skill(skill: AiSkillSchema, db: Session = Depends(get_db)):
    new_skill = AiSkill(
        name=skill.name,
        description=skill.description,
        skill_category=skill.skill_category,
        level=skill.level
    )
    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)
    return new_skill.id


@app.post("/api/preliminary_evaluation", response_model=int)
def create_preliminary_evaluation(preliminary: CreatePreliminaryEvaluationSchema, db: Session = Depends(get_db)):
    

    new_preliminary_evaluation = PreliminaryEvaluation(
        title = preliminary.title,
        description = preliminary.description,
        model = preliminary.model,
        experience_id = create_or_select_skill(db, preliminary.experience).id,
        reasoning_experience_id = create_or_select_skill(db, preliminary.reasoning_experience).id,
        difficulty_id = create_or_select_skill(db, preliminary.difficulty).id,
        difficulty_explaination = preliminary.difficulty_explaination,
        comments = preliminary.comments,
        realism = preliminary.realism,
        goal = preliminary.goal
    )
    db.add(new_preliminary_evaluation)
    db.commit()
    db.refresh(new_preliminary_evaluation)
    db.query(ExperimentLog).filter(ExperimentLog.id == preliminary.experiment_id).update({"preliminary_evaluation_id": new_preliminary_evaluation.id})
    db.commit()
    
    return new_preliminary_evaluation.id

@app.get("/api/preliminary_evaluation/{evaluation_id}", response_model=PreliminaryEvaluationSchema)
def get_preliminary_evaluation(evaluation_id: int, db: Session = Depends(get_db)):
    evaluation = db.query(PreliminaryEvaluation).get(evaluation_id)
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return evaluation

def justification_or(x, default = ""):
    if x is None:
        return default
    else:
        return x.justification
def score_or(db, x, default = None) -> Optional[int]:
    if x is None:
        return default
    else:
        return create_or_select_skill(db, x.score).id


@app.post("/api/final_evaluation", response_model=int)
def create_final_evaluation(evaluation: CreateFinalEvaluationSchema, db: Session = Depends(get_db)):
    new_evaluation = FinalEvaluation(
        overall_id=score_or(db, evaluation.overall),
        novelty_id=score_or(db, evaluation.novelty),
        productivity_id=score_or(db, evaluation.productivity),
        teamwork_id=score_or(db, evaluation.teamwork),
        completeness_id=score_or(db, evaluation.completeness),

        overall_justification=justification_or(evaluation.overall),
        novelty_justification=justification_or(evaluation.novelty),
        productivity_justification=justification_or(evaluation.productivity),
        teamwork_justification=justification_or(evaluation.teamwork),
        completeness_justification=justification_or(evaluation.completeness),

        productivity_improvement=evaluation.productivity_improvement or "",
        event_improvement=evaluation.event_improvement,
        main_strength = evaluation.main_strength,
        main_weakness = evaluation.main_weakness,
        daily_use = evaluation.daily_use,
    )
    db.add(new_evaluation)
    db.commit()
    db.refresh(new_evaluation)
    db.query(ExperimentLog).filter(ExperimentLog.id == evaluation.experiment_id).update({"final_evaluation_id": new_evaluation.id})
    return new_evaluation.id




@app.get("/api/experiment_file", response_model=list[int])
def get_experiment_turn_files(turn_id: Optional[int], db: Session = Depends(get_db)):
    if turn_id:
        return db.query(ExperimentTurnFiles.id).filter(ExperimentTurnFiles.turn_id == turn_id).all()
    else:
        return db.query(ExperimentTurnFiles.id).all()



@app.post("/api/experiment_file", response_model=int)
async def create_experiment_turn_file(
        file: Annotated[UploadFile, File()],
        turnid: Annotated[str, Form()],
        db: Session = Depends(get_db)):
    upload_path = FILES_PATH/str(uuid.uuid4())
    file_metadata = ExperimentTurnFiles(
        turn_id=int(turnid),
        file_path=str(upload_path)
    )
    with open(upload_path, 'wb') as f:
        f.write(await file.read())
    db.add(file_metadata)
    db.commit()
    db.refresh(file_metadata)
    return file_metadata.id
