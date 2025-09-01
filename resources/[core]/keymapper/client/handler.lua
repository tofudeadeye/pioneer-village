local Await = Citizen.Await
local ExecuteCommand = ExecuteCommand
local IsControlJustPressed, IsDisabledControlJustPressed, IsControlJustReleased, IsDisabledControlJustReleased, IsControlPressed, IsDisabledControlPressed = IsControlJustPressed, IsDisabledControlJustPressed, IsControlJustReleased, IsDisabledControlJustReleased, IsControlPressed, IsDisabledControlPressed
local KeyMapper = {
    keyboard = RawKeyCodes,

    game = GameKeyCodes,

    keybinds = {}
}

--- @param table table to get length of
local function tableLength(t)
    local retval = 0

    for k,v in pairs(t) do
        retval = retval + 1
    end

    return retval
end

--- @return threadId current id of the thread script is using
function KeyMapper:Thread()
    Wait(2000)
    exports['init']:resolveResource('keymapper')

    CreateThread(function()
        local Promise = promise.new()

        CreateThread(function(threadId)
            Promise:resolve(threadId)

            while true do
                for k,v in pairs(self.keybinds) do
                    if v.type == "keyboard" then
                        if IsRawKeyPressed(v.hash) then
                            for commandString, commandData in pairs(v.commandsList) do
                                if commandData.modifier and IsRawKeyPressed(commandData.modifier.hash) then
                                    ExecuteCommand(("+%s"):format(commandString))
                                elseif not commandData.modifier then
                                    ExecuteCommand(("+%s"):format(commandString))
                                end
                            end
                        elseif IsRawKeyReleased(v.hash) then
                            for commandString, commandData in pairs(v.commandsList) do
                                if commandData.modifier and IsRawKeyPressed(commandData.modifier.hash) then
                                    ExecuteCommand(("-%s"):format(commandString))
                                elseif not commandData.modifier then
                                    ExecuteCommand(("-%s"):format(commandString))
                                end
                            end
                        end
                    else
                        if IsControlJustPressed(0, v.hash) or IsDisabledControlJustPressed(0, v.hash) then
                            for commandString, commandData in pairs(v.commandsList) do
                                if commandData.modifier and (IsControlPressed(0, commandData.modifier.hash) or IsDisabledControlPressed(0, commandData.modifier.hash)) then
                                    ExecuteCommand(("+%s"):format(commandString))
                                elseif not commandData.modifier then
                                    ExecuteCommand(("+%s"):format(commandString))
                                end
                            end
                        elseif IsControlJustReleased(0, v.hash) or IsDisabledControlJustReleased(0, v.hash) then
                            for commandString, commandData in pairs(v.commandsList) do
                                if commandData.modifier and (IsControlPressed(0, commandData.modifier.hash) or IsDisabledControlPressed(0, commandData.modifier.hash)) then
                                    ExecuteCommand(("-%s"):format(commandString))
                                elseif not commandData.modifier then
                                    ExecuteCommand(("-%s"):format(commandString))
                                end
                            end
                        end
                    end
                end

                -- NOTE: Debugging
                --for k,v in pairs(self.keyboard) do
                --    if IsRawKeyPressed(v) then
                --        print(k, "pressed")
                --    end
                --end
                --for k,v in pairs(self.mouse) do
                --    if IsControlJustPressed(0, v) or IsDisabledControlJustPressed(0, v) then
                --        print(k, "pressed")
                --    end
                --end

                -- I didnt had the option the have a slower thread has if you're using the script its most likely going to use keybinds.
                Wait(0)

                --if tableLength(self.keybinds) == 0 then
                --    Wait(1000)
                --end
            end
        end)

        return Await(Promise)
    end)
end

--- @param commandString string command string
--- @param description string description of the keybind (if we ever make a ui for those keybinds to allow in game modification we would show this description)
--- @param inputType string keybord or mouse (Currently not supported i only added it for further implementation by cfx of the key mapper so it would be easier to migrate to it)
--- @param inputKey string Key input
--- @return boolean if the keybind has been succesfully registered
function KeyMapper.RegisterKeyMapping(commandString, description, inputType, inputKey, modifier)
    self = self or KeyMapper

    if commandString:sub(1,1) == "+" or commandString:sub(1,1) == "-" then
        commandString = commandString:sub(2, commandString:len())
    end

    if not inputKey then
        return false, print("Missing input key for key mapper")
    end

    inputKey = inputKey:upper()

    if not self[inputType] then
        return false, print(("Registering keymapping for command ' %s ' on key ' %s ' failed: the input type ' %s ' is invalid"):format(commandString, inputKey, inputType))
    end

    if not self[inputType][inputKey] then
        return false, print(("Registering keymapping for command ' %s ' on key ' %s ' failed: the key is missing in the key table"):format(commandString, inputKey))
    end


    if modifier then
        modifier = modifier:upper()

        if not self[inputType][modifier] then
            return false, print(("[M] Registering keymapping for command ' %s ' on key ' %s ' failed: the key is missing in the key table"):format(commandString, modifier))
        end
    end

    if not self.keybinds[inputKey] then
        self.keybinds[inputKey] = {hash = self[inputType][inputKey], type = inputType, commandsList = {}}
    end

    self.keybinds[inputKey].commandsList[commandString] = {description = description, inputType = inputType, inputKey = inputKey}

    self.keybinds[inputKey].commandsList[commandString].modifier = modifier and {hash = self[inputType][modifier], key = modifier} or nil
end
exports("RegisterKeyMapping", KeyMapper.RegisterKeyMapping)

--- @param commandString string command string
--- @param inputKey string Key input
--- @return boolean if the keybind has been succesfully removed
function KeyMapper.RemoveKeyMapping(commandString, inputKey)
    self = self or KeyMapper

    if inputKey then
        inputKey = inputKey:upper()

        if not self.keybinds[inputKey] then
            return false
        end

        self.keybinds[inputKey].commandsList[commandString] = nil

        if tableLength(self.keybinds[inputKey].commandsList) == 0 then
            self.keybinds[inputKey] = nil
        end

        return true
    end

    for inputKey,v in pairs(self.keybinds) do
        for command in pairs(v.commandsList) do
            if command == commandString then
                self.keybinds[inputKey].commandsList[command] = nil

                if tableLength(self.keybinds[inputKey].commandsList) == 0 then
                    self.keybinds[inputKey] = nil
                end

                return true
            end
        end
    end

    return false
end
exports("RemoveKeyMapping", KeyMapper.RemoveKeyMapping)

KeyMapper.threadId = KeyMapper:Thread()

-- Example:
-- RegisterCommand("test_keymapper", function(s,a,r)
-- 	if a[1] then
-- 		KeyMapper:RemoveKeyMapping("kek", "G")
-- 	else
-- 		KeyMapper:RegisterKeyMapping("kek", "stupid kek", "keyboard", "G", "SHIFT")
-- 		KeyMapper:RegisterKeyMapping("idk", "stupid idk", "keyboard", "F")

-- 		RegisterCommand("+idk", function()
-- 			print("+idk")
-- 		end)

-- 		RegisterCommand("-idk", function()
-- 			print("-idk")
-- 		end)

-- 		RegisterCommand("+kek", function()
-- 			print("+kek")
-- 		end)

-- 		RegisterCommand("-kek", function()
-- 			print("-kek")
-- 		end)
-- 	end
-- end)
