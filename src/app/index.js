function updateImageContainerSize() {
	const container = document.getElementById("imageContainer")
	const selectedOption = document.getElementById("image_size").options[document.getElementById("image_size").selectedIndex]
	const [width, height] = selectedOption.textContent.split(" ")[0].split("x")

	container.style.width = `${width}px`
	container.style.height = `${height}px`
}

function showAnimation() {
	document.getElementById("animationContainer").classList.remove("hidden")
}

function hideAnimation() {
	document.getElementById("animationContainer").classList.add("hidden")
}

function generateRandomSeed() {
	return Math.floor(Math.random() * 2 ** 32)
}

function isAutoIncrement() {
	if (document.getElementById("autoincrement").checked) {
		let value = 0
		try {
			value = parseInt(document.getElementById("seed").value)
			if (value > 2 ** 32 - 1) value = 0
		}
		catch (e) {
			console.log(e)
		}
		
		document.getElementById("seed").value = value + 1
	}
}

async function loadImage(url, elem) {
	return new Promise((resolve, reject) => {
		elem.onload = () => resolve(elem)
		elem.onerror = reject
		elem.src = url
	})
}

// Called From ajax.js
async function imageForm(stage, content) {
	if (stage == "postfetch") {
		if (content["image"]) {
			await loadImage(content["image"], document.getElementById("displayImage"))
			isAutoIncrement();
		} else {
			if (content["redirect"]) {
				window.location.href = content["redirect"]
			}
		}
		hideAnimation()		
	}

	if (stage == "prefetch") {
		// Show the marvelous SVG animation
		showAnimation()		
	}

	return content
}

function loadLocalStorage() {
	Object.keys(localStorage).forEach((key) => {
		if (document.getElementById(key)) {
			value = localStorage.getItem(key)

			if (value == "true" || value == "false") {
				document.getElementById(key).checked = value
			} else {
				document.getElementById(key).value = value + ""
			}
		}
	})
}

//-----------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
	// Load saved settings
	loadLocalStorage()

	// Initial setup
	document.getElementById("generateSeed").addEventListener("click", function () {
		document.getElementById("seed").value = generateRandomSeed()
	})
	window.addEventListener("resize", updateImageContainerSize)

	if (document.getElementById("seed").value == "")
		document.getElementById("seed").value = generateRandomSeed()
	
	document.getElementById("image_size").addEventListener("change", updateImageContainerSize)
	updateImageContainerSize()

	// Side panel toggle
	document.querySelector('.toggle-button').addEventListener('click', function() {
		document.getElementById('leftColumn').classList.toggle('w-96');
		document.getElementById('leftColumn').classList.toggle('w-12');
		document.getElementById('imageForm').classList.toggle('block');
		document.getElementById('imageForm').classList.toggle('hidden');
	})

})
