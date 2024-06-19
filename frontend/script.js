let chunks = [];
let mediaRecorder;

document.getElementById("startRecord").addEventListener("click", () => {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        chunks = [];
        const formData = new FormData();
        formData.append("audio", blob, "chunk.webm");

        await fetch("http://localhost:4000/upload", {
          method: "POST",
          body: formData,
        });

        const audioURL = URL.createObjectURL(blob);
        document.getElementById("audioPlayback").src = audioURL;
        document.getElementById("statusMessage").textContent =
          "Status: Recording stopped";
      };
      mediaRecorder.start();
      document.getElementById("startRecord").disabled = true;
      document.getElementById("stopRecord").disabled = false;
      document.getElementById("statusMessage").textContent =
        "Status: Recording started";
      //   setTimeout(() => {
      //     mediaRecorder.start();
      //   }, 5000); // 5 seconds
    })
    .catch((err) => console.log("The following error occurred: " + err));
});

document.getElementById("stopRecord").addEventListener("click", () => {
  mediaRecorder.stop();
  document.getElementById("startRecord").disabled = false;
  document.getElementById("stopRecord").disabled = true;
});

//shows count and status
document
  .getElementById("fetchLastResponse")
  .addEventListener("click", function () {
    fetch("http://localhost:4000/lastResponse")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        // document.getElementById(
        //   "responseMessage"
        // ).textContent = `Message: ${data.message}`;
        document.getElementById(
          "responseCount"
        ).textContent = `Count: ${data.count}`;
        document.getElementById(
          "responseStatus"
        ).textContent = `Status: ${data.status}`;
      })
      .catch((error) => {
        console.error("Error:", error);
        document.getElementById("responseMessage").textContent =
          "Error fetching data";
        document.getElementById("responseCount").textContent = "";
        document.getElementById("responseStatus").textContent = "";
      });
  });
