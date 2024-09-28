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
		} else {
			if (content["redirect"]) {
				window.location.href = content["redirect"]
			}
		}
		hideAnimation()		
	}

	if (stage == "prefetch") {
		showAnimation()		
	}

	return content
}

//-----------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
	document.getElementById("generateSeed").addEventListener("click", function () {
		document.getElementById("seed").value = generateRandomSeed()
	})
	window.addEventListener("resize", updateImageContainerSize)

	// Initial setup
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
