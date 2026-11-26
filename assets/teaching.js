(function() {
  const container = document.getElementById('teachingContainer');
  const dialog = document.getElementById('teachingDialog');
  const dialogTitle = document.getElementById('teachingDialogTitle');
  const dialogSessions = document.getElementById('teachingDialogSessions');
  if (!container || !dialog || !dialogTitle || !dialogSessions) return;

  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      dialog.close();
    }
  });

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function validateCourse(course, index) {
    if (!course || typeof course.title !== 'string' || !course.title.trim() ||
        typeof course.image !== 'string' || !course.image.trim() ||
        (course.description !== undefined && typeof course.description !== 'string') ||
        (course.course_link !== undefined && typeof course.course_link !== 'string') ||
        (course.sessions !== undefined && !Array.isArray(course.sessions))) {
      throw new Error(`Invalid teaching course at index ${index}.`);
    }
    if (course.course_link && !/^https?:\/\//i.test(course.course_link)) {
      throw new Error(`Invalid course_link for ${course.title}; use an HTTP(S) URL.`);
    }
    if ((course.sessions || []).some(session => !session ||
        typeof session.date !== 'string' || !session.date.trim() ||
        typeof session.place !== 'string' || !session.place.trim())) {
      throw new Error(`Invalid teaching session for ${course.title}.`);
    }
  }

  function showHistory(course) {
    dialogTitle.textContent = course.title;
    dialogSessions.replaceChildren();
    const sessions = course.sessions || [];
    if (!sessions.length) {
      dialogSessions.appendChild(element('p', 'teaching-empty', 'No teaching history available yet.'));
    } else {
      const list = element('ul', 'teaching-sessions');
      sessions.forEach(session => {
        const item = element('li', 'teaching-session');
        item.appendChild(element('span', 'teaching-session-date', session.date));
        item.appendChild(element('span', 'teaching-session-place', session.place));
        list.appendChild(item);
      });
      dialogSessions.appendChild(list);
    }
    dialog.showModal();
  }

  function renderCourse(course) {
    const card = element('article', 'teaching-card');
    const image = element('img', 'teaching-card-image');
    image.src = course.image;
    image.alt = '';
    card.appendChild(image);

    const content = element('div', 'teaching-card-content');
    content.appendChild(element('p', 'teaching-card-label', 'Course'));
    content.appendChild(element('h2', 'teaching-card-title', course.title));
    if (course.description) {
      content.appendChild(element('p', 'teaching-card-description', course.description));
    }

    const actions = element('div', 'teaching-card-actions');
    const history = element('button', 'teaching-action teaching-action-primary', 'Teaching history');
    history.type = 'button';
    history.setAttribute('aria-label', `View teaching history for ${course.title}`);
    history.addEventListener('click', () => showHistory(course));
    actions.appendChild(history);
    if (course.course_link) {
      const link = element('a', 'teaching-action teaching-action-link', 'Course link');
      link.href = course.course_link;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      actions.appendChild(link);
    }
    content.appendChild(actions);
    card.appendChild(content);
    return card;
  }

  async function loadTeaching() {
    try {
      const response = await fetch('assets/data/teaching.json');
      if (!response.ok) throw new Error(`Failed to load teaching.json: ${response.status}`);
      const courses = await response.json();
      if (!Array.isArray(courses)) throw new Error('teaching.json must contain an array of courses.');
      courses.forEach(validateCourse);
      if (!courses.length) {
        container.appendChild(element('p', 'teaching-empty', 'No courses available yet.'));
        return;
      }
      container.replaceChildren(...courses.map(renderCourse));
    } catch (error) {
      container.replaceChildren(element('p', 'teaching-empty', 'Failed to load courses.'));
      console.error(error);
    }
  }

  loadTeaching();
})();
