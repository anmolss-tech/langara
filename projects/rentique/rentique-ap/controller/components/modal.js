/*
  @Made By: Anmol Singh
 */
export function showModal(title, message = '', options = {}) {
  const {
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    inputType = null,
    iconType = null,
  } = options;

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const container = document.createElement("div");
  container.className = "modal-container";

  let iconHtml = '';
  if (iconType === 'danger' || iconType === `delete`) {
    iconHtml = `
      <div class="modal-icon">
        <svg width="62" height="66" viewBox="0 0 62 66" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_1278_18927)">
            <path d="M11.3952 65.251C9.23203 65.251 7.47073 63.4897 7.47073 61.3265V23.0981C7.47073 22.9681 7.36435 22.8617 7.23432 22.8617H3.9245C1.7613 22.8617 0 21.1004 0 18.9372C0 16.774 1.7613 15.0127 3.9245 15.0127H58.0637C60.2269 15.0127 61.9882 16.774 61.9882 18.9372C61.9882 21.1004 60.2269 22.8617 58.0637 22.8617H54.7539C54.6238 22.8617 54.5174 22.9681 54.5174 23.0981V61.3265C54.5174 63.4897 52.7561 65.251 50.5929 65.251H11.3952ZM15.568 22.8617C15.4379 22.8617 15.3316 22.9681 15.3316 23.0981V57.1538C15.3316 57.2838 15.4379 57.3902 15.568 57.3902H46.432C46.5621 57.3902 46.6684 57.2838 46.6684 57.1538V23.0981C46.6684 22.9681 46.5621 22.8617 46.432 22.8617H15.568Z" fill="#06324f"/>
            <path d="M38.7958 10.0949C38.0983 10.0949 37.4009 9.90582 36.7981 9.53937C34.9422 8.44004 32.9918 7.87264 30.9822 7.87264C27.8379 7.87264 25.6274 9.25567 25.391 9.40934C24.7409 9.83489 23.9843 10.0595 23.2042 10.0595C21.892 10.0595 20.6745 9.42116 19.9534 8.34547C18.7477 6.57235 19.1969 4.14909 20.9464 2.93155C21.1237 2.81335 25.2255 0 31.0532 0C34.4221 0 37.7083 0.933842 40.8171 2.7897C41.7155 3.32164 42.3538 4.18456 42.6139 5.20114C42.8739 6.21773 42.7203 7.26978 42.1765 8.17998C41.4673 9.36206 40.1788 10.0949 38.7958 10.0949Z" fill="#06324f"/>
            <path d="M24.587 48.7489C22.9558 48.7489 21.6318 46.9876 21.6318 44.8244V34.8122C21.6318 32.649 22.9558 30.8877 24.587 30.8877C26.2183 30.8877 27.5422 32.649 27.5422 34.8122V44.8244C27.5422 46.9876 26.2183 48.7489 24.587 48.7489Z" fill="#06324f"/>
            <path d="M37.2355 48.7489C35.6042 48.7489 34.2803 46.9876 34.2803 44.8244V34.8122C34.2803 32.649 35.6042 30.8877 37.2355 30.8877C38.8667 30.8877 40.1907 32.649 40.1907 34.8122V44.8244C40.1907 46.9876 38.8667 48.7489 37.2355 48.7489Z" fill="#06324f"/>
          </g>
          <defs><clipPath id="clip0_1278_18927"><rect width="62" height="65.2507" fill="white"/></clipPath></defs>
        </svg>
      </div>`;
  } else if (iconType === 'warning') {
    iconHtml = `
      <div class="modal-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 21H23L12 2L1 21ZM13 18H11V16H13V18ZM13 14H11V9H13V14Z" fill="#06324f"/>
        </svg>
      </div>`;
  }

  const inputHtml = inputType ? `
    <div class="modal-input-container">
      <input type="${inputType}" id="modalInput" class="modal-input" placeholder="Enter ${inputType}...">
    </div>` : '';
  
  const isDanger = iconType === 'danger';
  let buttonsHtml = ``;
  if( iconType === "delete"){
 buttonsHtml = onConfirm ? `
  <button class="modal-btn modal-btn--secondary">${cancelText}</button>
    <button class="modal-btn modal-btn--confirm ${isDanger ? 'modal-btn--danger' : ''}">${confirmText}</button>
  ` : `<button class="modal-btn modal-btn--primary">${confirmText}</button>`;

  }else{
     buttonsHtml = onConfirm ? `
    <button class="modal-btn modal-btn--confirm ${isDanger ? 'modal-btn--danger' : ''}">${confirmText}</button>
  ` : `<button class="modal-btn modal-btn--primary">${confirmText}</button>`;

  }
  
  container.innerHTML = `
    ${iconHtml}
    <h2 class="modal-title">${title}</h2>
    ${message ? `<p class="modal-message">${message}</p>` : ''}
    ${inputHtml}
    <div class="modal-buttons">${buttonsHtml}</div>
  `;

  overlay.appendChild(container);
  document.body.appendChild(overlay);
  
  const inputField = container.querySelector("#modalInput");
  if(inputField) inputField.focus();

  setTimeout(() => overlay.classList.add("active"), 10);

  const closeModal = (wasCancelled = false) => {
    overlay.classList.remove("active");
    setTimeout(() => {
      overlay.remove();
      if (wasCancelled && onCancel) {
        onCancel();
      }
    }, 300);
  };

  const confirmBtn = container.querySelector(".modal-btn--confirm");
  const cancelBtn = container.querySelector(".modal-btn--secondary");
  const primaryBtn = container.querySelector(".modal-btn--primary");

  if (onConfirm) {
    confirmBtn.addEventListener("click", () => {
      const inputValue = inputField ? inputField.value : null;
      closeModal();
      onConfirm(inputValue);
    });
    if(cancelBtn) cancelBtn.addEventListener("click", () => closeModal(true));
  } else if (primaryBtn) {
    primaryBtn.addEventListener("click", () => closeModal());
  }

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal(true);
});
  
  const escHandler = (e) => {
    if (e.key === "Escape") {
      closeModal(true);
      document.removeEventListener("keydown", escHandler);
    }
  };
  document.addEventListener("keydown", escHandler);

  return overlay; 
}