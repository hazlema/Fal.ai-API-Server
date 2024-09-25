function submitForm(e) {
	const formData = new FormData(e)

	// Convert FormData to a plain object
	const formObject = Object.fromEntries(formData.entries())

	console.log(formObject)

	fetch("/addcredits", {
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
				alert("Adding Credits Failed")
			}
		})
		.catch((error) => {
			console.error("Error:", error)
			alert("An error occurred while sending the form data. Check the console for details.")
		})
}

document.addEventListener("DOMContentLoaded", function () {
	const form = document.getElementById("creditsForm")

	// Events
	form.addEventListener("submit", function (e) {
		e.preventDefault()
		submitForm(form)
	})
})

