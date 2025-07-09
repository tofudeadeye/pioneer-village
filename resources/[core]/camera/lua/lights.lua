--[[

Light Manager System
A Lua-based light management system similar to the TypeScript camera manager.
Provides exports to manage lights using custom names for creation, deletion, and state management.

]]--

-- Light Manager Class
local LightManager = {}
LightManager.__index = LightManager

-- Static instance for singleton pattern
local instance = nil

-- Constructor
function LightManager:new()
    local self = setmetatable({}, LightManager)
    self.lights = {}
    self.activeLights = {}
    self.renderTick = nil

    -- Handle resource cleanup
    AddEventHandler('onResourceStop', function(resourceName)
        if resourceName == GetCurrentResourceName() then
            self:destruct()
        end
    end)

    return self
end

-- Singleton getInstance method
function LightManager.getInstance()
    if not instance then
        instance = LightManager:new()
    end
    return instance
end

-- Destructor - cleanup all lights
function LightManager:destruct()
    -- Clear the render tick
    if self.renderTick then
        self.renderTick = nil
    end

    self.lights = {}
    self.activeLights = {}
end

-- Create a new light
function LightManager:create(data)
    if not data or not data.id then
        print("LightManager: Light data or ID is missing")
        return false
    end

    if self.lights[data.id] then
        print("LightManager: Light " .. data.id .. " already exists")
        return true
    end

    -- Default values with explicit float conversion (except RGB which should be integers)
    local lightData = {
        id = data.id,
        posX = (data.posX or data.x or 0) + 0.0,
        posY = (data.posY or data.y or 0) + 0.0,
        posZ = (data.posZ or data.z or 0) + 0.0,
        colorR = data.colorR or data.r or 255,
        colorG = data.colorG or data.g or 255,
        colorB = data.colorB or data.b or 255,
        range = (data.range or 10) + 0.0,
        intensity = (data.intensity or 1) + 0.0,
        active = false
    }

    self.lights[data.id] = lightData
    print("LightManager: Created light " .. data.id)
    return true
end

-- Update light properties
function LightManager:update(id, data)
    if not self.lights[id] then
        print("LightManager: Light " .. id .. " does not exist")
        return false
    end

    local light = self.lights[id]

    -- Update properties if provided with explicit float conversion (except RGB)
    if data.posX or data.x then light.posX = (data.posX or data.x) + 0.0 end
    if data.posY or data.y then light.posY = (data.posY or data.y) + 0.0 end
    if data.posZ or data.z then light.posZ = (data.posZ or data.z) + 0.0 end
    if data.colorR or data.r then light.colorR = data.colorR or data.r end
    if data.colorG or data.g then light.colorG = data.colorG or data.g end
    if data.colorB or data.b then light.colorB = data.colorB or data.b end
    if data.range then light.range = data.range + 0.0 end
    if data.intensity then light.intensity = data.intensity + 0.0 end

    print("LightManager: Updated light " .. id)
    return true
end

-- Set light position
function LightManager:setPosition(id, x, y, z)
    if not self.lights[id] then
        print("LightManager: Light " .. id .. " does not exist")
        return false
    end

    self.lights[id].posX = x + 0.0
    self.lights[id].posY = y + 0.0
    self.lights[id].posZ = z + 0.0
    return true
end

-- Set light color
function LightManager:setColor(id, r, g, b)
    if not self.lights[id] then
        print("LightManager: Light " .. id .. " does not exist")
        return false
    end

    self.lights[id].colorR = r
    self.lights[id].colorG = g
    self.lights[id].colorB = b
    return true
end

-- Set light range
function LightManager:setRange(id, range)
    if not self.lights[id] then
        print("LightManager: Light " .. id .. " does not exist")
        return false
    end

    self.lights[id].range = range + 0.0
    return true
end

-- Set light intensity
function LightManager:setIntensity(id, intensity)
    if not self.lights[id] then
        print("LightManager: Light " .. id .. " does not exist")
        return false
    end

    self.lights[id].intensity = intensity + 0.0
    return true
end

-- Turn light on
function LightManager:turnOn(id)
    if not self.lights[id] then
        print("LightManager: Light " .. id .. " does not exist")
        return false
    end

    if self.activeLights[id] then
        print("LightManager: Light " .. id .. " is already active")
        return true
    end

    local light = self.lights[id]
    light.active = true
    self.activeLights[id] = true

    -- Start render tick if this is the first active light
    self:updateRenderTick()

    print("LightManager: Turned on light " .. id)
    return true
end

-- Turn light off
function LightManager:turnOff(id)
    if not self.lights[id] then
        print("LightManager: Light " .. id .. " does not exist")
        return false
    end

    if not self.activeLights[id] then
        print("LightManager: Light " .. id .. " is already inactive")
        return true
    end

    self.lights[id].active = false
    self.activeLights[id] = nil

    -- Update render tick (may clear it if no active lights)
    self:updateRenderTick()

    print("LightManager: Turned off light " .. id)
    return true
end

-- Toggle light state
function LightManager:toggle(id)
    if not self.lights[id] then
        print("LightManager: Light " .. id .. " does not exist")
        return false
    end

    if self.activeLights[id] then
        return self:turnOff(id)
    else
        return self:turnOn(id)
    end
end

-- Check if light exists
function LightManager:exists(id)
    return self.lights[id] ~= nil
end

-- Check if light is active
function LightManager:isActive(id)
    return self.activeLights[id] ~= nil
end

-- Get light data
function LightManager:getLight(id)
    return self.lights[id]
end

-- Get all lights
function LightManager:getAllLights()
    return self.lights
end

-- Get active lights
function LightManager:getActiveLights()
    local active = {}
    for id, _ in pairs(self.activeLights) do
        active[id] = self.lights[id]
    end
    return active
end

-- Update render tick based on active lights
function LightManager:updateRenderTick()
    local hasActiveLights = next(self.activeLights) ~= nil

    if hasActiveLights and not self.renderTick then
        -- Create render thread to draw all active lights
        self.renderTick = true
        Citizen.CreateThread(function()
            while self.renderTick and next(self.activeLights) ~= nil do
                for id, _ in pairs(self.activeLights) do
                    local light = self.lights[id]
                    if light then
                        DrawLightWithRange(
                            light.posX,
                            light.posY,
                            light.posZ,
                            light.colorR,
                            light.colorG,
                            light.colorB,
                            light.range,
                            light.intensity
                        )
                    end
                end
                Citizen.Wait(0)
            end
            self.renderTick = nil
        end)
        print("LightManager: Started render tick")
    elseif not hasActiveLights and self.renderTick then
        -- Clear render tick when no active lights
        self.renderTick = nil
        print("LightManager: Cleared render tick")
    end
end

-- Destroy a light
function LightManager:destroy(id)
    if not self.lights[id] then
        print("LightManager: Light " .. id .. " does not exist")
        return false
    end

    -- Turn off if active
    if self.activeLights[id] then
        self:turnOff(id)
    end

    -- Remove from lights table
    self.lights[id] = nil

    print("LightManager: Destroyed light " .. id)
    return true
end

-- Create global instance
local lightManager = LightManager.getInstance()

-- Export functions for use by other resources with light-scoped names
exports('lightCreate', function(data)
    return lightManager:create(data)
end)

exports('lightUpdate', function(id, data)
    return lightManager:update(id, data)
end)

exports('lightSetPosition', function(id, x, y, z)
    return lightManager:setPosition(id, x, y, z)
end)

exports('lightSetColor', function(id, r, g, b)
    return lightManager:setColor(id, r, g, b)
end)

exports('lightSetRange', function(id, range)
    return lightManager:setRange(id, range)
end)

exports('lightSetIntensity', function(id, intensity)
    return lightManager:setIntensity(id, intensity)
end)

exports('lightTurnOn', function(id)
    return lightManager:turnOn(id)
end)

exports('lightTurnOff', function(id)
    return lightManager:turnOff(id)
end)

exports('lightToggle', function(id)
    return lightManager:toggle(id)
end)

exports('lightExists', function(id)
    return lightManager:exists(id)
end)

exports('lightIsActive', function(id)
    return lightManager:isActive(id)
end)

exports('lightGet', function(id)
    return lightManager:getLight(id)
end)

exports('lightGetAll', function()
    return lightManager:getAllLights()
end)

exports('lightGetActive', function()
    return lightManager:getActiveLights()
end)

exports('lightDestroy', function(id)
    return lightManager:destroy(id)
end)

-- Additional convenience exports
exports('lightCreateAndTurnOn', function(data)
    if lightManager:create(data) then
        return lightManager:turnOn(data.id)
    end
    return false
end)

exports('lightCreateOrUpdate', function(data)
    if not data or not data.id then
        return false
    end

    if lightManager:exists(data.id) then
        return lightManager:update(data.id, data)
    else
        return lightManager:create(data)
    end
end)

exports('lightDestroyAll', function()
    lightManager:destruct()
    return true
end)

-- Example usage (commented out):
--[[

-- Create a light
exports.camera:lightCreate({
    id = "myLight",
    x = 100.0,
    y = 200.0,
    z = 30.0,
    r = 255,
    g = 0,
    b = 0,
    range = 15.0,
    intensity = 2.0
})

-- Turn it on
exports.camera:lightTurnOn("myLight")

-- Change its color to blue
exports.camera:lightSetColor("myLight", 0, 0, 255)

-- Turn it off
exports.camera:lightTurnOff("myLight")

-- Destroy it
exports.camera:lightDestroy("myLight")

]]--

--exports.camera:lightCreateAndTurnOn({
--    id = "myLight",
--    x = -764.771790,
--    y = -1292.466309,
--    z = 43.835415,
--    r = 255,
--    g = 0,
--    b = 255,
--    range = 100.0,
--    intensity = 100.0
--})

--Citizen.CreateThread(function()
--    while true do
--      -- Set the light to a random color
--        Wait(1000)
--        local r = math.random(0, 255)
--        local g = math.random(0, 255)
--        local b = math.random(0, 255)
--        exports.camera:lightSetColor("myLight", r, g, b)
--        exports.camera:lightSetIntensity("myLight", math.random(25, 100) * 1.001)
--        exports.camera:lightSetRange("myLight", math.random(50, 100) * 1.001)
--    end
--
--end)
