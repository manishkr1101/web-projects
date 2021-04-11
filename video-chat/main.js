// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyBJHUvJWRlIdl7UQZGevmXE69594l_J3KQ",
    authDomain: "fir-realtimedatabase-e07cc.firebaseapp.com",
    databaseURL: "https://fir-realtimedatabase-e07cc.firebaseio.com",
    projectId: "fir-realtimedatabase-e07cc",
    storageBucket: "fir-realtimedatabase-e07cc.appspot.com",
    messagingSenderId: "815909799824",
    appId: "1:815909799824:web:34cb0d35e5a36e31319515"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const firestore = firebase.firestore();

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
    ],
    iceCandidatePoolSize: 10,
};


const pc = new RTCPeerConnection(servers)
let localStream = null;
let remoteStream = null;

// HTML elements
const webcamButton = document.getElementById('webcamButton');
const webcamVideo = document.getElementById('webcamVideo');
const callButton = document.getElementById('callButton');
const callInput = document.getElementById('callInput');
const answerButton = document.getElementById('answerButton');
const remoteVideo = document.getElementById('remoteVideo');
const hangupButton = document.getElementById('hangupButton');

webcamButton.onclick = async function() {
    try {
        
        localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true})
    } catch (error) {
        alert(error)
    }
    // alert('got stream')
    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
    })
    // removing audio for local stream
    const [audioTrack] = localStream.getAudioTracks();
    localStream.removeTrack(audioTrack);

    webcamVideo.srcObject = localStream;
    
    remoteStream = new MediaStream();
    
    pc.ontrack = function(event) {
        console.log('ontrack triggered', event)
        hangupButton.disabled = false;
        event.streams[0].getTracks().forEach(track => {
            remoteStream.addTrack(track);
        });
    }
    
    remoteVideo.srcObject = remoteStream;

    callButton.disabled = false;
    answerButton.disabled = false;
    webcamButton.disabled = true;
}



callButton.onclick = async function() {
    const id = (Math.floor(Math.random() * 1000000007)) % 10000;
    const callDoc = firestore.collection('calls').doc(`vid${id}`);
    const offerCandidates = callDoc.collection('offerCandidates');
    const answerCandidates = callDoc.collection('answerCandidates');

    callInput.value = callDoc.id;

    pc.onicecandidate = event => {
        event.candidate && offerCandidates.add(event.candidate.toJSON());
    };

    const offerDescription = await pc.createOffer();
    pc.setLocalDescription(offerDescription)

    const offer = {
        sdp: offerDescription.sdp, 
        type: offerDescription.type
    };

    await callDoc.set({offer});

    callDoc.onSnapshot(snapshot => {
        console.log('calldoc onsnaphot called')
        const data = snapshot.data();
        if (!pc.currentRemoteDescription && data?.answer) {
            const answerDescription = new RTCSessionDescription(data.answer);
            pc.setRemoteDescription(answerDescription);
        }

    })

    // Listen for remote ICE candidates
    answerCandidates.onSnapshot(snapshot => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate);
            }
        });
    });

}

answerButton.onclick = async function() {
    const callId = callInput.value;
    const callDoc = firestore.collection('calls').doc(callId);
    const offerCandidates = callDoc.collection('offerCandidates');
    const answerCandidates = callDoc.collection('answerCandidates');

    pc.onicecandidate = event => {
        event.candidate && answerCandidates.add(event.candidate.toJSON());
    };

    const callData = (await callDoc.get()).data();

    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);
  
    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };
  
    await callDoc.update({ answer });

    offerCandidates.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          console.log(change)
          if (change.type === 'added') {
            let data = change.doc.data();
            pc.addIceCandidate(new RTCIceCandidate(data));
          }
        });
      });


}

hangupButton.onclick = function() {
    location.reload();
}


