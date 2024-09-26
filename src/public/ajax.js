async function postData(content, url) {
	try {
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(content),
		})
		return await response.json()
	} catch (error) {
		return { error: "An error occurred while processing your request." }
	}
}

async function processForm(form) {
	form.preventDefault()
	
	const formData   = new FormData(form.target)
	const formObject = Object.fromEntries(formData.entries())

	if (form.target.action && form.target.id) {
		let result = await postData(formObject, form.target.action)
		const functionName = form.target.id

		if (typeof window[functionName] === "function") {
			window[functionName](result, form.target.id)
		} else {
			console.log(`Function ${functionName} not found`)
		}
	} else {
		console.log("Fetch form missing ID or Action")
	}
}

document.addEventListener("DOMContentLoaded", function () {
	document.querySelectorAll("form[fetch=true]").forEach((e) => {
		addEventListener("submit", (e) => {
			processForm(e)
		})
	})
})
