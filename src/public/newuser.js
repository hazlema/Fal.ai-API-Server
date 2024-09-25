function submitForm(e) {
	const formData = new FormData(e)

	// Convert FormData to a plain object
	const formObject = Object.fromEntries(formData.entries())

	console.log(formObject)

	fetch("/create", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(formObject),
	})
		.then((response) => response.json())
		.then(async (data) => {
			if (data.text == "success") {
				if (data.redirect) {
					window.location.href = data.redirect
				}
			} else {
				alert("Create User Failed")
			}
		})
		.catch((error) => {
			console.error("Error:", error)
			alert("An error occurred while sending the form data. Check the console for details.")
		})
}

document.addEventListener("DOMContentLoaded", function () {
	const form = document.getElementById("loginForm")

	// Events
	form.addEventListener("submit", function (e) {
		e.preventDefault()
		submitForm(form)
	})
})

