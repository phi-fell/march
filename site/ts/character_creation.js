let allocated_attributes = {};
let race_attributes = {};

let skill_caps = {};

let race_choice = races[0][0];

let traitchoices = [];

function addTraitChoice() {
    let choice = $("#traitbuy :selected").val();
    if (traitchoices.includes(choice)) {//TODO also check race traits?
        alert("You already have that trait!");
        return;
    }
    if (traits.find((tr) => tr[0] === choice)[1].cost > essence) {
        alert("You do not have enough essence for that!");
        return;
    }
    essence -= traits.find((tr) => tr[0] === choice)[1].cost;
    traitchoices.push(choice);
    recalculate();
}

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
    let traitlist = $("#traits");
    traitlist.empty();
    for (const t of races.find((r) => r[0] === race_choice)[1].traits) {
        const trait = traits.find((tr) => tr[0] === t)[1];
        traitlist.append($('<li>').html('<span title="' + trait.description + '"><b>[' + trait.name + ']</b></span>'));
    }
    for (const t of traitchoices) {
        const trait = traits.find((tr) => tr[0] === t)[1];
        traitlist.append($('<li>').html('<span title="' + trait.description + '"><b>[' + trait.name + ']</b></span><button onclick="traitchoices=traitchoices.filter((tr)=>tr !==\'' + t + '\');essence +=' + trait.cost + ';recalculate()">-</button>'));
    }
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
    for (const t of traits.filter((tr) => tr[1].buyable)) {
        $('#traitbuy').append($('<option value="' + t[0] + '">').text(t[1].name + ' (' + t[1].cost + ')'));
    }
    for (const r of races) {
        $('#race').append($('<option value="' + r[0] + '">').text(r[1].name));
    }
    $("#race").val(race_choice).change();
});