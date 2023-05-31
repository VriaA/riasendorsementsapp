/*IMPORTED FUNCTIONS FROM FIREBASE */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import { getDatabase, ref, onValue, push, remove, update} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"

/* DOM ELEMENTS ASSIGNED TO VARIABLES */
const endorsementForm = document.getElementById('endorsement-form')
const endorsementTextarea = document.getElementById('endorsement-textarea')
const fromEl = document.getElementById('from-el')
const toEl = document.getElementById('to-el')
const endorsementsEl = document.getElementById('endorsements-el')
const publishCheck = document.getElementById('published-check')

/* INITIALIZATION OF WEB APP AND SET UP OF DATABASE REFERENCE */
const appSettings = {
                        databaseURL:'https://rias-endorsements-default-rtdb.europe-west1.firebasedatabase.app/'
}

const app = initializeApp(appSettings)
const database = getDatabase(app)
const endorsementsDB = ref(database, 'endorsements')

/* ENDORSEMENTINFOARR IS SAVED INTO LOCAL STORAGE WHEN THERE
 IS AN ENDORSMENT IN THE FIREBASE DATABASE AND THE SAVED 
 INFORMATION IS USED TO LIKE AND UNLIKE AN ENDORSMENT */
let endorsemntsInfoArr = []

let savedEndorsemntsInfoArr = JSON.parse(localStorage.getItem(' riasChampionsEndorsemntsInfoArr'))
if(savedEndorsemntsInfoArr) {
   endorsemntsInfoArr = savedEndorsemntsInfoArr
} 

/* USERENDORSEMENTSIDSARR IS AN ARRAY OF IDS THAT IS SAVED INTO LOCAL
STORAGE WHEN A USER PUBLISHES AN ENDORSEMENT AND THE SAVED
INFORMATION IS USED TO IDENTIFY AND DELETE AN ENDORSMENT */
let userEndorsementsIdsArr = []
let savedUserEndorsementsIds = JSON.parse(localStorage.getItem('riasUserEndorsementsIds'))
if(savedUserEndorsementsIds) {
    userEndorsementsIdsArr = savedUserEndorsementsIds
}

//PUSHES AN OBJECT CONTAINING THE ENDORSEMENT INFORMATION INPUTED BY A USER TO THE FIRBASE DATABASE ON SUBMIT
endorsementForm.addEventListener('submit', e=>{
    e.preventDefault()

    const newEndorsement = {
        to: toEl.value,
        endorsement: endorsementTextarea.value,
        from: fromEl.value,
        likes: 0
}
push(endorsementsDB, newEndorsement)
    fromEl.value = ''
    endorsementTextarea.value = ''
    toEl.value = ''

    saveUserEndorsementId()
    deleteEndorsement()
    renderCheckMarkBtn()
})

//RENDERS A CHECK MARK ON THE PUBLISH BUTTON WHEN AN ENDORSEMENT IS PUBLISHED.
function renderCheckMarkBtn() {
    setTimeout(_=> {
        publishCheck.style.display = 'block'
        publishCheck.style.opacity = '1'
        setTimeout(_=> {
            publishCheck.style.opacity = '0'
            setTimeout(_=> {
                publishCheck.style.display = 'none'
            }, 2000)
        }, 1200)
    }, 100)
}

/* LISTENS TO A CHANGE IN VALUE IN THE FIREBASE DATABASE,
GETS THE ENDORSEMENTS IN THE DATABASE AS OBJECTS,
CONVERTS EACH OBJECT INTO AN ARRAY AND PUSHES THE ARRAY INTO DBENDORSEMENT ARRAY.
SAVES THE UPDATED ENDORSEMENT INFO TO LOCAL STORAGE.
RENDERS ENDORSEMENTS,
DELETES / LIKES AN ENDORSEMENT ON CLICK*/

let dbEndorsementArray = []
onValue(endorsementsDB, snapshot=> {
    if(snapshot.exists()) {
        dbEndorsementArray = []
        const endorsementsDBArr = Object.entries(snapshot.val())
        dbEndorsementArray.push(endorsementsDBArr)
            if(!endorsemntsInfoArr ||endorsemntsInfoArr.length === 0) {
                createsavedEndorsemntsInfoArr(endorsementsDBArr)
             } else {
                    saveNewEndorsementToLocalStorage(endorsementsDBArr)
             } 
                    updateSavedEndorsemntsInfoArr(endorsementsDBArr)
                    renderEndorsement(endorsementsDBArr)
                    likeIconColor()
                    deleteEndorsement()
    } else {
        endorsementsEl.innerText = 'No endorsements yet.'
    }
})

/* SAVES THE ID AND AN ISLIKED BOOLEAN FOR EACH ENDORSEMENT IN THE FIREBASE DATABASE TO 
LOCAL STORAGE. THIS INFORMATION IS USED FOR LINKING AND UNLIKING AN ENDORSEMENT*/

/*SAVES ID AND ISLIKED INFORMATION OF THE LAST ENDORSEMENTS IN THE FIREBASE 
DATABASE WHEN savedEndorsemntsInfoArr IS NOT IN LOCAL STORAGE*/
function createsavedEndorsemntsInfoArr(endorsementsInDB) {
    endorsementsInDB.forEach(endorsement=> {
       endorsemntsInfoArr.push( {id: endorsement[0], isLiked: false})
        localStorage.setItem(' riasChampionsEndorsemntsInfoArr', JSON.stringify(endorsemntsInfoArr))
    })
}

/*SAVES ID AND ISLIKED INFORMATION OF THE LAST ENDORSEMENT IN THE FIREBASE 
DATABASE WHEN savedEndorsemntsInfoArr IS ALREADY IN LOCAL STORAGE */
function saveNewEndorsementToLocalStorage(databaseEndorsements) {
        if(endorsemntsInfoArr.length > 0 && databaseEndorsements.length > 0) {
            if ((endorsemntsInfoArr[endorsemntsInfoArr.length -1].id) !== (databaseEndorsements[databaseEndorsements.length -1][0])) {
                if(true) {
                   endorsemntsInfoArr.push( {id: databaseEndorsements[databaseEndorsements.length -1][0], isLiked: false} )
                }
            }
        }
        localStorage.setItem(' riasChampionsEndorsemntsInfoArr', JSON.stringify(endorsemntsInfoArr))
}

//REMOVES THE ID AND ISLIKED INFORMATION OF A DELETED ENDORSEMENT FROM LOCAL STORAGE
function updateSavedEndorsemntsInfoArr(endorsementsInDBArray) {
    if(endorsementsInDBArray) {
        const savedEndorsemntsInfoArr = JSON.parse(localStorage.getItem(' riasChampionsEndorsemntsInfoArr'))

        let updatedSavedEndorsemntsInfoArr = []
        for(let i = 0; i < endorsementsInDBArray.length; i++) {
            savedEndorsemntsInfoArr.filter(savedInfo=> {
                if (savedInfo.id === endorsementsInDBArray[i][0]) {
                    updatedSavedEndorsemntsInfoArr.push(savedInfo)
                }
            })
        }
       endorsemntsInfoArr = updatedSavedEndorsemntsInfoArr
        localStorage.setItem(' riasChampionsEndorsemntsInfoArr', JSON.stringify(endorsemntsInfoArr))
    }
}

/* PASSES INFORMATION ON EACH ENDORSEMENT IN THE FIREBASE 
DATABASE INTO AN HTML BOILER PLATE AND RENDERS THEM ON CALL */
function renderEndorsement(endorsementsArray) {
    endorsementsEl.innerHTML = ''
    endorsementsArray.forEach(endorsement=> {
        endorsementsEl.innerHTML += `
        <li class="endorsement" id="endorsement${endorsement[0]}">
            <p class="endorsement-to" id="endorsement-to-${endorsement[0]}" title="Receiver">To ${endorsement[1].to}</p>
            <i class="fa-solid fa-trash delete-icon" id="delete-endorsement${endorsement[0]}" data-delete="${endorsement[0]}" title="Delete endorsement"></i>
            <p class="endorsement-text" id="endorsement-text-${endorsement[0]}"> ${endorsement[1].endorsement}</p>
            <p class="endorsement-from" id="endorsement-from-${endorsement[0]}" title="Sender">From ${endorsement[1].from}</p>
            <div class="likes-cntr" id="likes-cntr${endorsement[0]}">
                <i class="fa-solid fa-heart" id="like-icon${endorsement[0]}" data-like="${endorsement[0]}" title="Like endorsement"></i>
                <span class="like-count" id="like-count${endorsement[0]}">${endorsement[1].likes}</span>
            </div>
        </li>`
    })
}

/*CHANGES THE HEART/LIKE ICON COLOR WHEN CALLED BASED ON THE VALUE OF THE CORRELATING IS LIKED BOOLEAN SAVED TO LOCAL STORAGE*/
function likeIconColor(likeIconId) {
    const endorsementsInDBArray = dbEndorsementArray[0]
    const savedEndorsemntsInfoArr = JSON.parse(localStorage.getItem(' riasChampionsEndorsemntsInfoArr'))
    if(savedEndorsemntsInfoArr) {
        for(let i = 0; i < endorsementsInDBArray.length; i++) {
            const savedIconInfo = savedEndorsemntsInfoArr.find(savedItem=> savedItem.id === endorsementsInDBArray[i][0])
            if((savedEndorsemntsInfoArr[i].id === endorsementsInDBArray[i][0]) && (savedIconInfo.isLiked === true)) {
                const likedIcon = document.getElementById(`like-icon${savedEndorsemntsInfoArr[i].id}`)
                likedIcon.classList.add('liked')
                likeIconAnimation(likeIconId)
            } else if((savedEndorsemntsInfoArr[i].id === endorsementsInDBArray[i][0]) && (savedIconInfo.isLiked === false))  {
                const unLikedIcon = document.getElementById(`like-icon${savedEndorsemntsInfoArr[i].id}`)
                unLikedIcon.classList.remove('liked')
                likeIconAnimation(likeIconId)
            }
        }
    }
}

/*CALLED WHEN A LIKE ICON IS CLICKED AND ANIMATES THE CLICKED LIKE ICON */
function likeIconAnimation(iconId) {
    if(iconId) {
        const clickedIcon = document.getElementById(`like-icon${iconId}`)
        clickedIcon.style.transform = 'scaleX(1.2)'
        setTimeout(_=> {
            clickedIcon.style.transform = 'scaleX(1)'
        }, 100)
    }
}

/*DELETES AN ENDORSMENT FROM THE FIRBASE DATABASE, 
DELETES THE MATCHING ENDORSEMENT INFO FROM LOCAL STORAGE,
DELETES THE ENDORSEMENT ID FROM LOCAL STORAGE*/
function deleteEndorsement() {
    const endorsementsInDBArray = dbEndorsementArray[0]
    const savedUserEndorsementsIds = JSON.parse(localStorage.getItem('riasUserEndorsementsIds'))
    const savedEndorsemntsInfoArr = JSON.parse(localStorage.getItem(' riasChampionsEndorsemntsInfoArr'))
    if(savedUserEndorsementsIds) {
        savedUserEndorsementsIds.forEach(savedEndorsementId=> {
            const endorsementLocationInDB = ref(database, `endorsements/${savedEndorsementId}`)
            const endorsementEl = document.getElementById(`endorsement${savedEndorsementId}`)
            const deleteIcon = document.getElementById(`delete-endorsement${savedEndorsementId}`)
    
            const databaseEndorsement = endorsementsInDBArray.filter(endorsementDB=> endorsementDB[0] === savedEndorsementId)[0]
            if(databaseEndorsement) {
                const databaseEndorsementId = databaseEndorsement[0]
                const savedUserEndorsementsIdIndex = savedUserEndorsementsIds.findIndex(savedId=> savedId === databaseEndorsementId)
                const savedisLikedIndex = savedEndorsemntsInfoArr.findIndex(savedInfo=> savedInfo.id === databaseEndorsementId)
            
                endorsementEl.addEventListener('mouseover', _=>{
                    deleteIcon.style.visibility = 'visible'
                })
        
                endorsementEl.addEventListener('mouseout', _=>{
                    deleteIcon.style.visibility = 'hidden'
                })
            
                deleteIcon.addEventListener('click', _=> {
                    savedUserEndorsementsIds.splice(savedUserEndorsementsIdIndex, 1)
                    savedEndorsemntsInfoArr.splice(savedisLikedIndex, 1)
                    userEndorsementsIdsArr = savedUserEndorsementsIds
                   endorsemntsInfoArr = savedEndorsemntsInfoArr
                    setTimeout(_=> {
                        localStorage.setItem('riasUserEndorsementsIds', JSON.stringify(savedUserEndorsementsIds))
                        localStorage.setItem(' riasChampionsEndorsemntsInfoArr', JSON.stringify(savedEndorsemntsInfoArr))
                        setTimeout(_=> {
                            deleteAnimation(endorsementEl)
                            setTimeout(_=> {
                                remove(endorsementLocationInDB, `endorsements/${savedEndorsementId}`)
                            }, 1200)
                        }, 200)
                    }, 100)
                })
            }
        })
    }
}

//ANIMATES AN ENDORSEMENT WHILE IT'S BEING DELETED
function deleteAnimation(endorsement) {
    endorsement.style.transform = 'translateX(-100%)'
    endorsement.style.opacity = '0'
}

//INCREASES THE LIKE COUNT OF AN ENDORSEMENT BASED ON THE VALUE OF THE CORRELATING ISLIKED VARIABLE IN LOCAL STORAGE
endorsementsEl.addEventListener('click', e=>{
        
        const savedEndorsemntsInfoArr = JSON.parse(localStorage.getItem(' riasChampionsEndorsemntsInfoArr'))
        const selectedArrayItem = savedEndorsemntsInfoArr.find(array => array.id === e.target.dataset.like)
        if(selectedArrayItem) {
            const countEl = document.getElementById(`like-count${selectedArrayItem.id}`)
            let count = Number(countEl.innerHTML)
                if(selectedArrayItem.isLiked === false) {
                       count += 1
                       like(selectedArrayItem.id, count)
                } else if (selectedArrayItem.isLiked === true) {
                       count -= 1
                       unlike(selectedArrayItem.id, count)
                }selectedArrayItem.isLiked = !selectedArrayItem.isLiked
               endorsemntsInfoArr = savedEndorsemntsInfoArr
                localStorage.setItem(' riasChampionsEndorsemntsInfoArr', JSON.stringify(savedEndorsemntsInfoArr))
            likeIconColor(e.target.dataset.like)  
        }
})

//UPDATES AN INCREASED LIKECOUNT FOR THE LIKED ENDORSEMENT IN THE FIREBASE DATABASE
function like(locationId, likeCount) {
    const locationInDB = ref(database, `endorsements/${locationId}`)
    update(locationInDB, {likes: likeCount})
}

//UPDATES A DECREASED LIKECOUNT FOR THE UNLIKED ENDORSEMENT IN THE FIREBASE DATABASE
function unlike(locationId, likeCount) {
    const locationInDB = ref(database, `endorsements/${locationId}`)
    update(locationInDB, { likes: likeCount})
}

//SAVES THE ID OF THE ENDORSEMENT THE USER PUBLISHED TO LOCAL STORAGE TO BE USED LATER TO IDENTIFY AN ENDORSEMENT AND DELETE IT
function saveUserEndorsementId() {
        const endorsementsInDBArray = dbEndorsementArray[0]
    
        if(userEndorsementsIdsArr) {
            if ((userEndorsementsIdsArr[userEndorsementsIdsArr.length -1]) !== (endorsementsInDBArray[endorsementsInDBArray.length -1][0])) {
                userEndorsementsIdsArr.push(endorsementsInDBArray[endorsementsInDBArray.length -1][0])
            }
        } else {
            userEndorsementsIdsArr.push(endorsementsInDBArray[endorsementsInDBArray.length -1][0])
        }

        localStorage.setItem('riasUserEndorsementsIds', JSON.stringify(userEndorsementsIdsArr))
}