import rethinkClient from '../utils/rethinkdb';
import { teacherHasPermission, userHasPermission, studentHasPermission } from '../utils/permissions';
import {ForbiddenError} from 'apollo-server-errors';

export default {
  Query: {
    classroomLesson: classroomLesson,
    classroomLessons: classroomLessonsIndex,
    classroomLessonSession: classroomLessonSession
  },
  ClassroomLesson: {
    editions: editions,
    edition: edition
  },
  Edition: {
    questions: editionQuestions,
    lesson: editionLesson
  },
  ClassroomLessonSession: {
    edition: sessionEdition
  },
  Mutation: {
    setSessionCurrentSlide
  },
  Subscription: {
    classroomLessonSession: {
      subscribe: async (parent, {id, studentId}, ctx) => {
        const sess = await getClassroomLessonSession(id);
        const channel = id;
        if (!userHasPermission(sess, ctx.user)) return new ForbiddenError("You don't have access to this session.")
        if (teacherHasPermission(sess, ctx.user)) {
          getSessionRethinkRoot(id)
          .changes({ includeInitial: true })
          .run((err, cursor) => {
            cursor.each((err, document) => {
              if (err) throw err
              let session = document.new_val;
              if (session) {
                ctx.pubSub.publish(channel, {classroomLessonSession: session})
              }
            })
            setAbsentTeacherState(id, false);
            ctx.socket.onDisconnect = () => {
              setAbsentTeacherState(id, true);
              cursor.close()
            }
          })
        }
        else if (studentId && studentHasPermission(sess, ctx.user)) {
          setTimeout(() => {
            setStudentPresence(id, studentId, true);
          }, 1000)
          
          ctx.socket.onDisconnect = () => {
            removeValueFromSession(id, {'presence': {[studentId]: true}})
          }
        }
        return ctx.pubSub.asyncIterator(channel)
      }
    }
  }
}


function classroomLessonsIndex(parent, args, ctx) {
  return rethinkClient.db('quill_lessons').table('classroom_lessons').run()
}

function classroomLesson(parent, {id}) {
  return rethinkClient.db('quill_lessons').table('classroom_lessons').get(id).run()
}

function editions(parent, args, ctx) {
  return rethinkClient.db('quill_lessons').table('lesson_edition_metadata').filter({lesson_id:  parent.id}).run()
}

function sessionEdition({edition_id}, args, ctx) {
  return rethinkClient.db('quill_lessons').table('lesson_edition_metadata').get(edition_id).run()
}

function edition(parent, {id}, ctx) {
  return rethinkClient.db('quill_lessons').table('lesson_edition_metadata').get(id).run()
}

async function editionQuestions(parent, args, ctx) {
  const questionsData = await rethinkClient.db('quill_lessons').table('lesson_edition_questions').get(parent.id).run();
  return questionsData.questions
}

function editionLesson({lesson_id}, args, ctx) {
  return rethinkClient.db('quill_lessons').table('classroom_lessons').get(lesson_id).run()
}

async function classroomLessonSession(parent, {id}, ctx) {
  const sessionData = await getClassroomLessonSession(id)
  if (userHasPermission(sessionData, ctx.user)) {
    return sessionData
  } else {
    return new ForbiddenError("You don't have access to this session.")
  }
  
}

function setSessionCurrentSlide(parent, {id, slideNumber}, ctx) {
  if (teacherHasPermission(parent, ctx.user)) {
    return rethinkClient.db('quill_lessons').table('classroom_lesson_sessions').get(id).update({current_slide: slideNumber}).run();
  } else {
    return new ForbiddenError("You are not the teacher of this session")
  }
}

async function getClassroomLessonSession(id: string) {
  return await getSessionRethinkRoot(id).run();
}

function getSessionRethinkRoot(id: string) {
  return rethinkClient.db('quill_lessons').table('classroom_lesson_sessions').get(id)
}

function setAbsentTeacherState(id: string, value: boolean) {
  getSessionRethinkRoot(id)
    .update({absentTeacherState: value})
    .run()
}

function setStudentPresence(id: string, studentId: string, value: boolean) {
  getSessionRethinkRoot(id).update({'presence': {
    [studentId]: value
  }}).run()
}

function removeValueFromSession(id: string, valueToRemove: any):void {
  getSessionRethinkRoot(id)
    .replace(rethinkClient.row.without(valueToRemove))
    .run()
    .then(result => {
      console.log("Returned: ", result)
    })
  
}

