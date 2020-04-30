-- Export animation as spritesheet with gotg compatible json

local spr = app.activeSprite
if not spr then return print('No active sprite') end

local file_name = app.fs.filePathAndTitle(spr.filename)

local dlg = Dialog()
dlg:file{ id="image_file",
          label="Image File:",
          title="Choose File",
          open=false,
          save=true,
          filename= file_name .. ".png",
          filetypes={ "png" }, }
dlg:file{ id="json_file",
          label="JSON File:",
          title="Choose File",
          open=false,
          save=true,
          filename=file_name .. ".json",
          filetypes={"json" }, }
dlg:button{ id="ok", text="OK" }
dlg:button{ id="cancel", text="Cancel" }
dlg:show()
local data = dlg.data
if data.ok then
	app.command.ExportSpriteSheet {
		ui=false,
		askOverwrite=true,
		type=SpriteSheetType.HORIZONTAL,
		columns=0,
		rows=0,
		width=0,
		height=0,
		bestFit=false,
		textureFilename=data.image_file,
		borderPadding=0,
		shapePadding=0,
		innerPadding=0,
		trim=false,
		extrude=false,
		openGenerated=false,
		layer="",
		tag="",
		splitLayers=false,
		listLayers=true,
		listTags=true,
		listSlices=true
	}
	local file = io.open(data.json_file, "w")
	local success = file:write([[
{
    "offset": {
        "x": 0,
        "y": 0,
        "rotates": false
    },
    "scale": {
        "x": 1,
        "y": 1
    },
    "delay": ]] .. math.floor(spr.frames[1].duration * 1000) .. [[,
    "frame_width": ]] .. spr.width .. [[,
    "frame_height": ]] .. spr.height .. [[,
    "frames": ]] .. #(spr.frames) .. [[ 
}
	]])
	if success then
		app.alert("Export Complete!")
	else
		app.alert("Export Failed! Could not write JSON!")
	end
end