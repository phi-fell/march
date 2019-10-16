let allocated_attributes = {};
let race_attributes = {};

let skill_caps = {};

let race_choice = "avrilen";

function finishCreation() {
    $.ajax({
        url: '/create',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            'credentials': loadCredentials(),
            'name': $('#name').text(),
            'race': race_choice,
            'attributes': allocated_attributes,
            'skills': skill_caps,
        }),
        success: (data) => {
            console.log(data);
            if (data.status === 'fail') {
                alert(data.alert);
            } else if (data.status === 'success') {
                window.location.href = data.redirect || '/';
            }
        },
        dataType: 'json',
    });
}

function getAttrVal(attr) {
    return allocated_attributes[attr] + race_attributes[attr];
}

function recalculate() {
    $('#gold').text(60);
    $('#essence').text(essence);
    for (let attr of attributes) {
        $('#' + attr).text(getAttrVal(attr));
    }
    for (let skill of skills) {
        $('#' + skill).text(skill_caps[skill] * 5)
    }
    $('#flesh').text(getAttrVal('VITALITY'));
    $('#blood').text(getAttrVal('VITALITY') + getAttrVal('ENDURANCE'));
    $('#bone').text(getAttrVal('VITALITY') + getAttrVal('STRENGTH'));
    $('#soul').text(getAttrVal('INTUITION') + getAttrVal('CHARISMA'));
    $('#stamina').text(getAttrVal('ENDURANCE'));
    $('#ap').text('/' + ((getAttrVal('SPEED') * 5) + 10) + ' (+' + ((getAttrVal('SPEED') * 2) + 5) + ')');
    $('#initiative').text('AP + ' + getAttrVal('PERCEPTION'));
}

function setRace(race) {
    race_choice = race;
    for (let attr of attributes) {
        race_attributes[attr] = 10;
    }
    if (race === "avrilen") {
        race_attributes.LOGIC += 4;
        race_attributes.PERCEPTION += 2;
    } else if (race === "neathling") {
        race_attributes.AGILITY += 4;
        race_attributes.DEXTERITY += 2;
    } else if (race === "marrow") {
        race_attributes.CHARISMA += 4;
        race_attributes.INTUITION += 2;
    } else if (race === "blooded") {
        race_attributes.VITALITY += 4;
        race_attributes.ENDURANCE += 2;
    }
    recalculate();
}

function addAttributePoint(attr) {
    if (essence >= allocated_attributes[attr] + 1) {
        essence -= ++allocated_attributes[attr];
    }
    recalculate();
}
function removeAttributePoint(attr) {
    if (allocated_attributes[attr] > 0) {
        essence += allocated_attributes[attr]--;
    }
    recalculate();
}

function increaseSkillCap(skill) {
    if (essence >= skill_caps[skill] + 1) {
        essence -= ++skill_caps[skill];
    }
    recalculate();
}

function decreaseSkillCap(skill) {
    if (skill_caps[skill] > 0) {
        essence += skill_caps[skill]--;
    }
    recalculate();
}

$(() => {
    for (let attr of attributes) {
        allocated_attributes[attr] = 0;
        race_attributes[attr] = 0;
    }
    for (let skill of skills) {
        skill_caps[skill] = 0;
    }
    $('#name').text('Enter A Name');
    $('#race').append($('<option value="avrilen">').text("Avrilen Wanderer"));
    $('#race').append($('<option value="neathling">').text("Neathling Outcast"));
    $('#race').append($('<option value="marrow">').text("Marrow Fallen"));
    $('#race').append($('<option value="blooded">').text("Blooded Redvein"));
    $("#race").val(race_choice).change();
});