let allocated_attributes = {};
let race_attributes = {};

let skill_caps = {};

let race_choice = races[0][0];

function finishCreation() {
    $.ajax({
        url: '/character_creation',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
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
    race_attributes = races.find((r) => r[0] === race)[1].baseAttributes;
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
    for (const r of races) {
        $('#race').append($('<option value="' + r[0] + '">').text(r[1].name));
    }
    $("#race").val(race_choice).change();
});