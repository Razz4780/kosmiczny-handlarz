import {checkAuth, getGames, getTopScores, login, register, uploadGame} from "./api.js";
import {addListener, closeModal, getElement, setModalChild, setModalHtml} from "./common.js";

function loggedIn(username: string, token: string) {
    const section = getElement("auth-section");
    section.innerHTML = `<p>Hello ${username}!</p>`;
    const logoutButton = document.createElement("button");
    logoutButton.innerText = "Logout";
    logoutButton.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.reload();
    });
    section.appendChild(logoutButton);
    const newGameForm = document.createElement("form");
    const gameNameInput = document.createElement("input");
    gameNameInput.type = "text";
    gameNameInput.required = true;
    gameNameInput.placeholder = "Game name";
    let wrapper = document.createElement("p");
    wrapper.appendChild(gameNameInput);
    newGameForm.appendChild(wrapper);
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.required = true;
    wrapper = document.createElement("p");
    wrapper.appendChild(fileInput);
    newGameForm.appendChild(wrapper);
    const newGameSubmit = document.createElement("button");
    newGameSubmit.type = "submit";
    newGameSubmit.innerText = "Create new game";
    wrapper = document.createElement("p");
    wrapper.appendChild(newGameSubmit);
    newGameForm.appendChild(wrapper);
    newGameForm.addEventListener("submit", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const gameName = gameNameInput.value;
        gameNameInput.value = "";
        const gameFile = (fileInput.files as FileList)[0];
        uploadGame(token, gameName, gameFile)
            .then(errors => {
                if (errors.length) {
                    alert(errors.join("\n"));
                } else {
                    alert("Game created.");
                }
            })
            .catch(alert);
    });
    section.appendChild(newGameForm);
}

function openGameModal() {
    getGames()
        .then(games => {
            if (games.length === 0) {
                setModalHtml("<p>No games available</p>");
                return;
            }
            const startGameForm = document.createElement("form");
            const nickInput = document.createElement("input");
            nickInput.type = "text";
            nickInput.placeholder = "Your nick";
            nickInput.required = true;
            let wrapper = document.createElement("p");
            wrapper.appendChild(nickInput);
            startGameForm.appendChild(nickInput);
            const gameSelect = document.createElement("select");
            games.forEach(game => {
                const option = document.createElement("option");
                option.value = game.uuid;
                option.innerText = game.name;
                gameSelect.appendChild(option);
            });
            wrapper = document.createElement("p");
            wrapper.appendChild(gameSelect);
            startGameForm.appendChild(wrapper);
            const submitButton = document.createElement("button");
            submitButton.type = "submit";
            submitButton.innerText = "Start the game";
            startGameForm.appendChild(submitButton);
            startGameForm.action = "./game.html";
            startGameForm.addEventListener("submit", () => {
                localStorage.setItem("gameId", gameSelect.value);
                localStorage.setItem("nick", nickInput.value);
            });
            setModalChild(startGameForm);
        })
        .catch(alert);
}

function fetchTopScores() {
    getTopScores()
        .then(data => {
            const list = getElement("top-scores-list");
            data.forEach(score => {
                const listItem = document.createElement("li");
                listItem.innerText = `${score.player} - ${score.score} (${score.name})`;
                list.appendChild(listItem);
            });
        })
        .catch(alert);
}

document.addEventListener("DOMContentLoaded", () => {
    addListener("login-form", "submit", true, () => {
        const usernameInput = getElement("username-login") as HTMLInputElement;
        const passwordInput = getElement("password-login") as HTMLInputElement;
        login(usernameInput.value, passwordInput.value)
            .then(data => {
                if (data === undefined) {
                    alert("Invalid username or password.");
                } else {
                    localStorage.setItem("token", data.token);
                    loggedIn(data.username, data.token);
                }
            })
            .catch(alert)
            .finally(() => {
                usernameInput.value = "";
                passwordInput.value = "";
            });
    });
    addListener("register-form", "submit", true, () => {
        const usernameInput = getElement("username-register") as HTMLInputElement;
        const passwordInput = getElement("password-register") as HTMLInputElement;
        register(usernameInput.value, passwordInput.value)
            .then(errors => {
                if (errors.length) {
                    alert(errors.join("\n"));
                } else {
                    alert("You can now log in.");
                }
            })
            .catch(alert)
            .finally(() => {
                usernameInput.value = "";
                passwordInput.value = "";
            });
    });
    addListener("open-game-modal", "click", false, openGameModal);
    addListener("modal-exit", "click", false, closeModal);
    const token = localStorage.getItem("token");
    if (token !== null) {
        checkAuth(token).then(username => {
            if (username !== undefined) {
                loggedIn(username, token);
            } else {
                localStorage.removeItem("token");
            }
        }).catch(err => {
            alert(err);
        })
    }
    fetchTopScores();
});
