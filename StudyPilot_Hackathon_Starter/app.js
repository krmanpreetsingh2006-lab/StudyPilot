// ======================================================
// STUDYPILOT
// COMPLETE FIREBASE STUDY PLANNER
// (UI upgraded – all core logic preserved)
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
let allTasksCache = [];
let currentFilter = "all";



// ================= TOAST ===============================

function showToast(message, type = "success") {
  const container = $("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    toast.style.transition = "0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}



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


      // Show user email
      const emailEl = $("userEmail");
      if (emailEl) {
        emailEl.textContent = user.email || "Student";
      }


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



    showToast("Study plan generated successfully! 🎉", "success");


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


  allTasksCache = tasks;



  // =====================================================
  // STATS
  // =====================================================

  const completedCount = tasks.filter(t => t.done === true).length;
  const percentage = tasks.length > 0
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;

  const statSubjects = $("statSubjects");
  const statTasks = $("statTasks");
  const statCompleted = $("statCompleted");
  const statProgress = $("statProgress");

  if (statSubjects) statSubjects.textContent = subjects.length;
  if (statTasks) statTasks.textContent = tasks.length;
  if (statCompleted) statCompleted.textContent = completedCount;
  if (statProgress) statProgress.textContent = percentage + "%";



  // =====================================================
  // SUBJECT DISPLAY
  // =====================================================

  if (subjects.length > 0) {

    $("subjects").innerHTML =
      subjects
        .map(subject => {

          return `

            <div class="subject-card">

              <h3>📚 ${escapeHtml(subject.subject)}</h3>

              <div class="subject-meta">
                <span>${subject.topics ? subject.topics.length : 0} topics</span>
                <span>Exam: ${escapeHtml(subject.examDate)}</span>
                <span>Daily: ${subject.dailyHours} hrs</span>
              </div>

            </div>

          `;

        })
        .join("");


  } else {

    $("subjects").innerHTML =
      `<div class="empty-state"><div class="emoji">📖</div><p>No subjects yet. Add one above!</p></div>`;

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
        <div class="empty-state">
          <div class="emoji">🎉</div>
          <p>You're all caught up!</p>
          <p style="font-size:0.85rem;margin-top:4px;color:var(--text-dim)">No tasks scheduled for today.</p>
        </div>
      `;

  }



  // =====================================================
  // ALL TASKS (with filter support)
  // =====================================================

  renderFilteredTasks(tasks);



  // =====================================================
  // TASK EVENTS
  // =====================================================

  attachTaskEvents();



  // =====================================================
  // PROGRESS
  // =====================================================

  $("progressBar")
    .style
    .width =
      percentage + "%";


  $("progressText")
    .textContent =
      `${percentage}% completed (${completedCount}/${tasks.length})`;


  // Circular progress
  const circle = $("progressCircle");
  const percentEl = $("progressPercent");
  if (circle) {
    const circumference = 2 * Math.PI * 54; // r=54
    const offset = circumference - (percentage / 100) * circumference;
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = offset;
  }
  if (percentEl) {
    percentEl.textContent = percentage + "%";
  }

}



// ======================================================
// FILTER TASKS
// ======================================================

function renderFilteredTasks(tasks) {
  const todayString = formatDate(new Date());
  let filtered = tasks;

  if (currentFilter === "pending") {
    filtered = tasks.filter(t => !t.done);
  } else if (currentFilter === "completed") {
    filtered = tasks.filter(t => t.done);
  } else if (currentFilter === "today") {
    filtered = tasks.filter(t => t.date === todayString);
  }

  if (filtered.length > 0) {
    $("tasks").innerHTML = filtered
      .map(task => createTaskHTML(task, task.date === todayString))
      .join("");
  } else {
    $("tasks").innerHTML = `
      <div class="empty-state">
        <div class="emoji">📝</div>
        <p>${currentFilter === "all" ? "Add your first subject to generate tasks." : "No tasks match this filter."}</p>
      </div>
    `;
  }
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
    >

      <!-- CHECKBOX -->

      <input
        type="checkbox"
        class="taskCheck task-check"
        data-id="${task.id}"
        ${
          task.done
            ? "checked"
            : ""
        }
      >



      <!-- TASK BODY -->

      <div class="task-body">
        <div class="task-title">
          <span class="subject-badge">${escapeHtml(task.subject)}</span>
          ${escapeHtml(task.topic)}
          ${todayTask ? " 🔥" : ""}
        </div>
        <div class="task-meta">
          ${escapeHtml(task.date)}
        </div>
      </div>



      <!-- ACTIONS -->

      <div class="task-actions">

        <input
          type="date"
          class="taskDate task-date"
          data-id="${task.id}"
          value="${escapeHtml(task.date)}"
        >

        <button
          class="saveDateBtn btn-icon"
          data-id="${task.id}"
          title="Save date"
        >
          💾
        </button>

        <button
          class="deleteTaskBtn btn-icon btn-danger"
          data-id="${task.id}"
          title="Delete"
        >
          🗑️
        </button>

      </div>

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


              showToast("Task date updated! 📅", "success");


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

        showToast("🎉 Saare tasks complete hain!", "success");

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

        showToast("Plan already properly arranged hai. 👍", "success");

        return;

      }



      await batch.commit();


      await loadData();


      showToast(
        `${changed} unfinished task(s) ko smartly reschedule kar diya! 🔄`,
        "success"
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



// ======================================================
// UI HELPERS (sidebar + filters) – pure presentation
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

  // Sidebar toggle (mobile)
  const toggle = $("sidebarToggle");
  const sidebar = $("sidebar");
  if (toggle && sidebar) {
    toggle.onclick = () => {
      sidebar.classList.toggle("open");
    };
  }

  // Nav active state
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
      item.classList.add("active");
      if (sidebar) sidebar.classList.remove("open");
    });
  });

  // Filter buttons
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter || "all";
      renderFilteredTasks(allTasksCache);
      attachTaskEvents();
    });
  });

});