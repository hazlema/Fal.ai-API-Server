async function loadImage(url, elem) {
	return new Promise((resolve, reject) => {
		elem.onload = () => resolve(elem)
		elem.onerror = reject
		elem.src = url
	})
}

function updateImageContainerSize() {
	const container = document.getElementById("imageContainer")
	const selectedOption = document.getElementById("image_size").options[document.getElementById("image_size").selectedIndex]
	const [width, height] = selectedOption.textContent.split(" ")[0].split("x")

	container.style.width = `${width}px`
	container.style.height = `${height}px`
}

function showAnimation() {
	document.getElementById("animationContainer").classList.add("show")
}

function hideAnimation() {
	document.getElementById("animationContainer").classList.remove("show")
}

function generateRandomSeed() {
	return Math.floor(Math.random() * 2 ** 32)
}

function submitForm(e) {
	const formData = new FormData(e)

	// Convert FormData to a plain object
	const formObject = Object.fromEntries(formData.entries())

	// Convert numeric values
	formObject.steps = parseInt(formObject.steps)
	formObject.seed = parseInt(formObject.seed)
	formObject.guidance = parseFloat(formObject.guidance)

	showAnimation() // Show the animation when form is submitted

	fetch("/data", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(formObject),
	})
		.then((response) => response.json())
		.then(async (data) => {
			if (data["image"]) {
				await loadImage(data["image"], document.getElementById("displayImage"))
				hideAnimation()
			} else {
				if (data["redirect"]) {
					window.location.href = data["redirect"]
				}
			}
		})
		.catch((error) => {
			console.error("Error:", error)
			alert("An error occurred while sending the form data. Check the console for details.")
		})
}

//-----------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
	const form = document.getElementById("imageForm")

	// Events
	form.addEventListener("submit", function (e) {
		e.preventDefault()
		submitForm(form)
	})

	document.getElementById("generateSeed").addEventListener("click", function () {
		document.getElementById("seed").value = generateRandomSeed()
	})

	window.addEventListener("resize", updateImageContainerSize)


	// Initial setup
	document.getElementById("seed").value = generateRandomSeed()
	document.getElementById("image_size").addEventListener("change", updateImageContainerSize)
	updateImageContainerSize()
})
