// ======================================================
// STUDYPILOT
// COMPLETE FIREBASE STUDY PLANNER
// ======================================================


// ================= FIREBASE APP ========================

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";


import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";



// ================= FIREBASE CONFIG =====================

const firebaseConfig = {

  apiKey: "AIzaSyCtbq0oLodeyCowwi_qnzWxExlHPTtNpAI",

  authDomain:
    "studypilot-b6377.firebaseapp.com",

  projectId:
    "studypilot-b6377",

  storageBucket:
    "studypilot-b6377.firebasestorage.app",

  messagingSenderId:
    "160686216964",

  appId:
    "1:160686216964:web:4101385abf7bd406006251",

  measurementId:
    "G-DKC9YWSJTS"
};



// ================= INITIALIZE ==========================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);



// ================= HELPER ==============================

const $ = (id) =>
  document.getElementById(id);


let currentUser = null;



// ======================================================
// SIGN UP
// ======================================================

$("signupBtn").onclick = async () => {

  const email =
    $("email").value.trim();

  const password =
    $("password").value;


  if (!email || !password) {

    $("authMsg").textContent =
      "Please enter email and password.";

    return;
  }


  if (password.length < 6) {

    $("authMsg").textContent =
      "Password must be at least 6 characters.";

    return;
  }


  try {

    $("authMsg").textContent =
      "Creating account...";


    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );


    $("authMsg").textContent =
      "Account created successfully! 🎉";


  } catch (error) {

    console.error(error);

    $("authMsg").textContent =
      "Signup Error: " +
      error.message;
  }

};



// ======================================================
// LOGIN
// ======================================================

$("loginBtn").onclick = async () => {

  const email =
    $("email").value.trim();

  const password =
    $("password").value;


  if (!email || !password) {

    $("authMsg").textContent =
      "Please enter email and password.";

    return;
  }


  try {

    $("authMsg").textContent =
      "Logging in...";


    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );


    $("authMsg").textContent =
      "Login successful! 🎉";


  } catch (error) {

    console.error(error);

    $("authMsg").textContent =
      "Login Error: " +
      error.message;
  }

};



// ======================================================
// LOGOUT
// ======================================================

$("logoutBtn").onclick = async () => {

  try {

    await signOut(auth);

  } catch (error) {

    console.error(error);

    alert(
      "Logout failed:\n\n" +
      error.message
    );

  }

};



// ======================================================
// AUTH STATE
// ======================================================

onAuthStateChanged(
  auth,
  async (user) => {

    currentUser = user;


    if (user) {

      $("authCard")
        .classList
        .add("hidden");


      $("app")
        .classList
        .remove("hidden");


      $("logoutBtn")
        .classList
        .remove("hidden");


      try {

        await loadData();

      } catch (error) {

        console.error(error);

        alert(
          "Data load nahi ho raha:\n\n" +
          error.message
        );

      }

    } else {

      $("authCard")
        .classList
        .remove("hidden");


      $("app")
        .classList
        .add("hidden");


      $("logoutBtn")
        .classList
        .add("hidden");

    }

  }
);



// ======================================================
// ADD SUBJECT + GENERATE PLAN
// ======================================================

$("addBtn").onclick = async () => {

  if (!currentUser) {

    alert("Please login first.");

    return;
  }


  const subject =
    $("subject")
      .value
      .trim();


  const topics =
    $("topics")
      .value
      .split(",")
      .map(topic => topic.trim())
      .filter(topic => topic.length > 0);


  const examDate =
    $("examDate").value;


  const hours =
    Number($("hours").value) || 2;



  // ================= VALIDATION ========================

  if (!subject) {

    alert(
      "Please enter subject name."
    );

    return;
  }


  if (topics.length === 0) {

    alert(
      "Please enter at least one topic."
    );

    return;
  }


  if (!examDate) {

    alert(
      "Please select exam date."
    );

    return;
  }


  if (hours < 1 || hours > 12) {

    alert(
      "Daily hours should be between 1 and 12."
    );

    return;
  }



  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );


  const selectedDate =
    new Date(
      examDate + "T00:00:00"
    );


  if (selectedDate < today) {

    alert(
      "Exam date cannot be in the past."
    );

    return;
  }



  try {

    // ================= SAVE SUBJECT ====================

    const subjectRef =
      await addDoc(
        collection(db, "subjects"),
        {

          uid:
            currentUser.uid,

          subject:
            subject,

          topics:
            topics,

          examDate:
            examDate,

          dailyHours:
            hours,

          createdAt:
            Date.now()

        }
      );



    // ================= CALCULATE DAYS ================

    const millisecondsPerDay =
      1000 *
      60 *
      60 *
      24;


    let daysAvailable =
      Math.ceil(
        (
          selectedDate -
          today
        ) /
        millisecondsPerDay
      ) + 1;


    if (daysAvailable < 1) {

      daysAvailable = 1;

    }



    // ================= CREATE TASKS ===================

    const batch =
      writeBatch(db);



    /*
      Daily hours ka use:

      1 hour  -> 1 topic/day
      2 hours -> 2 topics/day
      3 hours -> 3 topics/day
      etc.

      Isse planner daily workload ko
      hours ke according distribute karega.
    */


    const topicsPerDay =
      Math.max(
        1,
        Math.floor(hours)
      );


    let topicIndex = 0;



    for (
      let day = 0;
      day < daysAvailable &&
      topicIndex < topics.length;
      day++
    ) {

      for (
        let h = 0;
        h < topicsPerDay &&
        topicIndex < topics.length;
        h++
      ) {

        const taskDate =
          new Date(today);


        taskDate.setDate(
          today.getDate() + day
        );


        const dateString =
          formatDate(taskDate);


        const taskRef =
          doc(
            collection(db, "tasks")
          );


        batch.set(
          taskRef,
          {

            uid:
              currentUser.uid,

            subject:
              subject,

            topic:
              topics[topicIndex],

            done:
              false,

            date:
              dateString,

            dailyHours:
              hours,

            subjectId:
              subjectRef.id,

            examDate:
              examDate,

            createdAt:
              Date.now()

          }
        );


        topicIndex++;

      }

    }



    /*
      Agar topics daily capacity se zyada hain,
      remaining topics ko exam date se pehle
      available days mein distribute karenge.
    */


    while (
      topicIndex <
      topics.length
    ) {

      let placed = false;


      for (
        let day = 0;
        day < daysAvailable &&
        topicIndex < topics.length;
        day++
      ) {

        const taskDate =
          new Date(today);


        taskDate.setDate(
          today.getDate() + day
        );


        const dateString =
          formatDate(taskDate);


        const taskRef =
          doc(
            collection(db, "tasks")
          );


        batch.set(
          taskRef,
          {

            uid:
              currentUser.uid,

            subject:
              subject,

            topic:
              topics[topicIndex],

            done:
              false,

            date:
              dateString,

            dailyHours:
              hours,

            subjectId:
              subjectRef.id,

            examDate:
              examDate,

            createdAt:
              Date.now()

          }
        );


        topicIndex++;

        placed = true;


        if (
          topicIndex >=
          topics.length
        ) {

          break;

        }

      }


      if (!placed) {

        break;

      }

    }



    await batch.commit();



    // ================= CLEAR INPUTS ====================

    $("subject").value = "";

    $("topics").value = "";

    $("examDate").value = "";

    $("hours").value = "2";



    await loadData();



    alert(
      "Study plan generated successfully! 🎉"
    );


  } catch (error) {

    console.error(
      "GENERATE PLAN ERROR:",
      error
    );


    alert(
      "Plan generate nahi hua.\n\n" +
      error.message
    );

  }

};



// ======================================================
// LOAD ALL DATA
// ======================================================

async function loadData() {

  if (!currentUser) {

    return;

  }



  // ================= SUBJECTS ==========================

  const subjectQuery =
    query(
      collection(
        db,
        "subjects"
      ),
      where(
        "uid",
        "==",
        currentUser.uid
      )
    );


  const subjectSnapshot =
    await getDocs(
      subjectQuery
    );


  const subjects =
    subjectSnapshot.docs.map(
      document => ({

        id:
          document.id,

        ...document.data()

      })
    );



  // ================= TASKS =============================

  const taskQuery =
    query(
      collection(
        db,
        "tasks"
      ),
      where(
        "uid",
        "==",
        currentUser.uid
      )
    );


  const taskSnapshot =
    await getDocs(
      taskQuery
    );


  const tasks =
    taskSnapshot.docs.map(
      document => ({

        id:
          document.id,

        ...document.data()

      })
    );



  // ================= SORT ==============================

  tasks.sort(
    (a, b) =>
      String(a.date)
        .localeCompare(
          String(b.date)
        )
  );



  // =====================================================
  // SUBJECT DISPLAY
  // =====================================================

  if (subjects.length > 0) {

    $("subjects").innerHTML =
      subjects
        .map(subject => {

          return `

            <div class="subjectBox">

              <b>
                ${escapeHtml(
                  subject.subject
                )}
              </b>

              <br>

              <small>

                ${
                  subject.topics
                    ? subject.topics.length
                    : 0
                }

                topics

                • Exam:

                ${escapeHtml(
                  subject.examDate
                )}

                • Daily:

                ${
                  subject.dailyHours
                } hrs

              </small>

            </div>

          `;

        })
        .join("");


  } else {

    $("subjects").innerHTML =
      "<p>No subjects yet.</p>";

  }



  // =====================================================
  // TODAY TASKS
  // =====================================================

  const todayString =
    formatDate(
      new Date()
    );


  const todayTasks =
    tasks.filter(
      task =>
        task.date ===
        todayString
    );



  if (
    todayTasks.length > 0
  ) {

    $("todayTasks").innerHTML =
      todayTasks
        .map(
          task =>
            createTaskHTML(
              task,
              true
            )
        )
        .join("");

  } else {

    $("todayTasks").innerHTML =
      `
        <p>
          🎉 No tasks for today.
        </p>
      `;

  }



  // =====================================================
  // ALL TASKS
  // =====================================================

  if (tasks.length > 0) {

    $("tasks").innerHTML =
      tasks
        .map(
          task =>
            createTaskHTML(
              task,
              false
            )
        )
        .join("");

  } else {

    $("tasks").innerHTML =
      `
        <p>
          Add your first subject
          to generate tasks.
        </p>
      `;

  }



  // =====================================================
  // TASK EVENTS
  // =====================================================

  attachTaskEvents();



  // =====================================================
  // PROGRESS
  // =====================================================

  const completedTasks =
    tasks.filter(
      task =>
        task.done === true
    ).length;


  const percentage =
    tasks.length > 0
      ? Math.round(
          (
            completedTasks /
            tasks.length
          ) * 100
        )
      : 0;


  $("progressBar")
    .style
    .width =
      percentage + "%";


  $("progressText")
    .textContent =
      `${percentage}% completed (${completedTasks}/${tasks.length})`;

}



// ======================================================
// CREATE TASK HTML
// ======================================================

function createTaskHTML(
  task,
  todayTask
) {

  const doneClass =
    task.done
      ? "done"
      : "";


  const todayClass =
    todayTask
      ? "todayTask"
      : "";


  return `

    <div
      class="task ${doneClass} ${todayClass}"
      style="
        display:flex;
        flex-wrap:wrap;
        gap:10px;
        align-items:center;
        margin-bottom:10px;
      "
    >

      <!-- CHECKBOX -->

      <input
        type="checkbox"
        class="taskCheck"
        data-id="${task.id}"
        ${
          task.done
            ? "checked"
            : ""
        }
        style="width:auto"
      >



      <!-- TASK NAME -->

      <span style="flex:1; min-width:180px">

        <b>
          ${escapeHtml(
            task.subject
          )}
        </b>

        —

        ${escapeHtml(
          task.topic
        )}

        ${
          todayTask
            ? " 🔥"
            : ""
        }

      </span>



      <!-- DATE -->

      <input
        type="date"
        class="taskDate"
        data-id="${task.id}"
        value="${escapeHtml(
          task.date
        )}"
      >



      <!-- SAVE DATE -->

      <button
        class="saveDateBtn secondary"
        data-id="${task.id}"
      >
        💾
      </button>



      <!-- DELETE -->

      <button
        class="deleteTaskBtn secondary"
        data-id="${task.id}"
      >
        🗑️
      </button>

    </div>

  `;

}



// ======================================================
// ATTACH TASK EVENTS
// ======================================================

function attachTaskEvents() {



  // ================= CHECKBOX ==========================

  document
    .querySelectorAll(
      ".taskCheck"
    )
    .forEach(
      checkbox => {

        checkbox.onchange =
          async () => {

            try {

              await updateDoc(
                doc(
                  db,
                  "tasks",
                  checkbox.dataset.id
                ),

                {
                  done:
                    checkbox.checked
                }

              );


              await loadData();


            } catch (error) {

              console.error(
                error
              );


              alert(
                "Task update nahi hua:\n\n" +
                error.message
              );

            }

          };

      }
    );



  // ================= DATE SAVE =========================

  document
    .querySelectorAll(
      ".saveDateBtn"
    )
    .forEach(
      button => {

        button.onclick =
          async () => {

            const taskId =
              button.dataset.id;


            const dateInput =
              document.querySelector(
                `.taskDate[data-id="${taskId}"]`
              );


            const newDate =
              dateInput.value;


            if (!newDate) {

              alert(
                "Please select a date."
              );

              return;

            }



            try {

              await updateDoc(
                doc(
                  db,
                  "tasks",
                  taskId
                ),

                {
                  date:
                    newDate
                }

              );


              await loadData();


              alert(
                "Task date updated! 📅"
              );


            } catch (error) {

              console.error(
                error
              );


              alert(
                "Date update nahi hua:\n\n" +
                error.message
              );

            }

          };

      }
    );



  // ================= DELETE ============================

  document
    .querySelectorAll(
      ".deleteTaskBtn"
    )
    .forEach(
      button => {

        button.onclick =
          async () => {

            const confirmDelete =
              confirm(
                "Kya tum ye task delete karna chahte ho?"
              );


            if (!confirmDelete) {

              return;

            }


            try {

              await deleteDoc(
                doc(
                  db,
                  "tasks",
                  button.dataset.id
                )
              );


              await loadData();


            } catch (error) {

              console.error(
                error
              );


              alert(
                "Task delete nahi hua:\n\n" +
                error.message
              );

            }

          };

      }
    );

}



// ======================================================
// SMART ADJUST PLAN
// ======================================================

$("adjustBtn").onclick =
  async () => {

    if (!currentUser) {

      alert(
        "Please login first."
      );

      return;

    }



    try {

      // ================================================
      // GET SUBJECTS
      // ================================================

      const subjectQuery =
        query(
          collection(
            db,
            "subjects"
          ),
          where(
            "uid",
            "==",
            currentUser.uid
          )
        );


      const subjectSnapshot =
        await getDocs(
          subjectQuery
        );


      const subjects =
        subjectSnapshot.docs.map(
          document => ({

            id:
              document.id,

            ...document.data()

          })
        );



      // ================================================
      // GET TASKS
      // ================================================

      const taskQuery =
        query(
          collection(
            db,
            "tasks"
          ),
          where(
            "uid",
            "==",
            currentUser.uid
          )
        );


      const taskSnapshot =
        await getDocs(
          taskQuery
        );


      const tasks =
        taskSnapshot.docs.map(
          document => ({

            id:
              document.id,

            ...document.data()

          })
        );



      // ================================================
      // UNFINISHED TASKS
      // ================================================

      const unfinished =
        tasks.filter(
          task =>
            task.done === false
        );


      if (
        unfinished.length === 0
      ) {

        alert(
          "🎉 Saare tasks complete hain!"
        );

        return;

      }



      // ================================================
      // TODAY
      // ================================================

      const today =
        new Date();


      today.setHours(
        0,
        0,
        0,
        0
      );



      // ================================================
      // MISSED TASKS FIRST
      // ================================================

      unfinished.sort(
        (a, b) => {

          const dateA =
            new Date(
              a.date + "T00:00:00"
            );


          const dateB =
            new Date(
              b.date + "T00:00:00"
            );


          return (
            dateA -
            dateB
          );

        }
      );



      // ================================================
      // GROUP BY SUBJECT
      // ================================================

      const subjectGroups =
        {};


      unfinished.forEach(
        task => {

          if (
            !subjectGroups[
              task.subjectId
            ]
          ) {

            subjectGroups[
              task.subjectId
            ] = [];

          }


          subjectGroups[
            task.subjectId
          ].push(task);

        }
      );



      // ================================================
      // ROUND ROBIN SUBJECTS
      // ================================================

      const orderedTasks = [];


      const subjectIds =
        Object.keys(
          subjectGroups
        );


      let index = 0;


      while (true) {

        let added = false;


        for (
          const subjectId
          of subjectIds
        ) {

          const list =
            subjectGroups[
              subjectId
            ];


          if (
            index <
            list.length
          ) {

            orderedTasks.push(
              list[index]
            );


            added = true;

          }

        }


        if (!added) {

          break;

        }


        index++;

      }



      // ================================================
      // CREATE NEW SCHEDULE
      // ================================================

      const batch =
        writeBatch(db);


      let changed =
        0;


      let currentDate =
        new Date(today);



      for (
        const task
        of orderedTasks
      ) {

        const taskExamDate =
          task.examDate
            ? new Date(
                task.examDate +
                "T00:00:00"
              )
            : null;


        /*
          Agar current date exam ke baad pahunch gayi,
          to exam date par task rakhenge.
        */


        if (
          taskExamDate &&
          currentDate >
          taskExamDate
        ) {

          currentDate =
            new Date(
              taskExamDate
            );

        }



        const newDate =
          formatDate(
            currentDate
          );



        if (
          task.date !==
          newDate
        ) {

          batch.update(

            doc(
              db,
              "tasks",
              task.id
            ),

            {
              date:
                newDate
            }

          );


          changed++;

        }



        /*
          Next task ko next day par rakhte hain.

          Isse backlog ek hi din mein
          dump nahi hota.
        */

        currentDate.setDate(
          currentDate.getDate() + 1
        );

      }



      if (
        changed === 0
      ) {

        alert(
          "Plan already properly arranged hai. 👍"
        );

        return;

      }



      await batch.commit();


      await loadData();


      alert(
        `${changed} unfinished task(s) ko smartly reschedule kar diya! 🔄`
      );


    } catch (error) {

      console.error(
        "SMART ADJUST ERROR:",
        error
      );


      alert(
        "Plan adjust nahi hua:\n\n" +
        error.message
      );

    }

  };



// ======================================================
// DATE FORMAT
// ======================================================

function formatDate(date) {

  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return (
    year +
    "-" +
    month +
    "-" +
    day
  );

}



// ======================================================
// HTML SECURITY
// ======================================================

function escapeHtml(value) {

  return String(value)
    .replace(
      /[&<>"']/g,

      character => ({

        "&":
          "&amp;",

        "<":
          "&lt;",

        ">":
          "&gt;",

        '"':
          "&quot;",

        "'":
          "&#039;"

      }[character])

    );

}