fx_version 'cerulean'
games { 'rdr3' }
rdr3_warning 'I acknowledge that this is a prerelease build of RedM, and I am aware my resources *will* become incompatible once RedM ships.'

lua54 'yes'

client_scripts {
  'client/dataview.lua',
  'client/crun.lua',
  'client/keys.lua',
  'client/noclip.lua'
}

server_script 'server/*.lua'
