/*
  @Made By: Anmol Singh
 */
class ModalService {
    constructor() {
        this.modalContainer = document.getElementById('modalContainer');
        this.titleEl = document.getElementById('modalTitle');
        this.messageEl = document.getElementById('modalMessage');
        this.inputContainer = document.getElementById('modalInputContainer');
        this.inputEl = document.getElementById('modalInput');
        this.buttonContainer = document.getElementById('modalButtonContainer');

        if (!this.modalContainer) {
            console.error('[ModalService] - CRITICAL ERROR: Modal container with ID "modalContainer" was not found in the HTML. Modals will not work.');
        }
    }

    showAlert(title, message) {
        if (!this.modalContainer) return Promise.resolve();

        return new Promise((resolve) => {
            this.titleEl.textContent = title;
            this.messageEl.textContent = message;
            this.inputContainer.style.display = 'none';

            this.buttonContainer.innerHTML = ''; 
            const okButton = document.createElement('button');
            okButton.textContent = 'OK';
            okButton.className = 'modal-btn modal-btn--primary';
            
            okButton.onclick = () => {
                this.modalContainer.classList.remove('show');
                resolve();
            };

            this.buttonContainer.appendChild(okButton);
            this.modalContainer.classList.add('show');
        });
    }

    showPrompt(title, message, placeholder = 'Enter value') {
        if (!this.modalContainer) return Promise.resolve(null);

        return new Promise((resolve) => {
            this.titleEl.textContent = title;
            this.messageEl.textContent = message;

            this.inputEl.value = '';
            this.inputEl.type = 'password'; 
            this.inputEl.placeholder = placeholder;
            this.inputContainer.style.display = 'block';

            this.buttonContainer.innerHTML = '';

            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Cancel';
            cancelButton.className = 'modal-btn modal-btn--secondary';
            cancelButton.onclick = () => {
                this.modalContainer.classList.remove('show');
                resolve(null);
            };

            const confirmButton = document.createElement('button');
            confirmButton.textContent = 'Confirm';
            confirmButton.className = 'modal-btn modal-btn--primary';
            confirmButton.onclick = () => {
                this.modalContainer.classList.remove('show');
                resolve(this.inputEl.value);
            };

            this.buttonContainer.appendChild(cancelButton);
            this.buttonContainer.appendChild(confirmButton);
            this.modalContainer.classList.add('show');
            this.inputEl.focus();
        });
    }
}

export const modalService = new ModalService();