/*
 * Some common functions used in DOM manipulation.
 */

export function addListener(id: string, event: string, prevent: boolean, callback: () => void) {
    const domElement = document.getElementById(id);
    if (domElement !== null) {
        if (prevent) {
            domElement.addEventListener(event, (event) => {
                event.stopPropagation();
                event.preventDefault();
                callback();
            })
        } else {
            domElement.addEventListener(event, callback);
        }
    }
}

export function getElement(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (element === null) {
        alert("An unexpected error occurred.");
        throw new Error(`${id} not found.`);
    } else {
        return element;
    }
}

export function closeModal() {
    getElement("modal").style.display = "none";
}

export function setModalChild(child: HTMLElement) {
    const modalContent = getElement("modal-content");
    modalContent.innerHTML = "";
    modalContent.appendChild(child);
    getElement("modal").style.display = "block";
}

export function setModalHtml(html: string) {
    const modalContent = getElement("modal-content");
    modalContent.innerHTML = html;
    getElement("modal").style.display = "block";
}
