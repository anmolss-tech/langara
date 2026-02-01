const btnModeSelect = document.querySelector("#dark-mode-input")
const footer = document.querySelector("footer")

const setThemeClass = () => {
  const theme = localStorage.getItem("theme")

  if (theme == "dark") {
    footer.classList.add("dark-mode-selected")
  } else {
    footer.classList.remove("dark-mode-selected")
  }
}

btnModeSelect.addEventListener("change", (e) => {
  if (e.target.checked) {
    localStorage.setItem("theme", "dark")
  } else {
    localStorage.setItem("theme", "light")
  }

  setThemeClass()
})

setThemeClass()
