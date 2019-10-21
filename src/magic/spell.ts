import { AFFINITY } from '../character/characteraffinities';
import { SKILL } from '../character/characterskills';

export class Spell {
    public method: SKILL = SKILL.IMPOSITION;
    public school: SKILL = SKILL.ILLUSION;
    public affinity: AFFINITY = AFFINITY.ALTERATION;
}

// spell examples
// fireball: (imposition or incantation, or conversion in some examples, sigilry would be unlikely because speed) (conjuration) (fire)
// alter appearance: (imposition or incantation or sigilry) (illusion) (none)
// minor heal: (imposition or incantation or supplication) (restoration) (flesh)
// heal bones: ^ but (bone) instead of (flesh)

// so things to note:
// if a spell requires a chant, it's incantation
// if its fueled by blood magic or a stored soul it's conversion
// if you must ask a deity or other being, its supplication
// if it's a pure exertion of will, it's imposition
// if one, for example, wanted to melt a door, if they knew the name of water, they could use manifestation to make the door take on the aspect of fluidity.
