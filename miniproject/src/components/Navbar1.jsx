import React from 'react'

const Navbar1 = () => {
  return (
    <>
    {/* Navbar */}
    <nav className="h-[50px] bg-white border-b border-gray-200 top-0 left-0 right-0 z-50 flex items-center justify-between px-6 shadow-md">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
            EzzAlgo
          </span>
          <Select value={currentAlgo} onValueChange={setCurrentAlgo}>
            <SelectTrigger className="w-48 bg-white border-2 border-gray-200 hover:border-indigo-400 text-gray-800 h-[30px] w-[10rem] transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-700/20  backdrop-blur-md text-zinc-800">
              {Object.keys(algorithms).map(algo => (
                <SelectItem key={algo} value={algo}>{algo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-gray-800 hover:text-gray-100">
          <Button variant="outline" className="flex items-center h-[33px] w-[90px] p-0 gap-2 border-2 border-zinc-400 bg-zinc-100 hover:bg-zinc-900 text-gray-800 hover:text-gray-100">
            <User className="h-5 w-5  " />
            <span className="font-small">Login</span>
          </Button>
        </div>
      </nav>
    </>
  )
}

export default Navbar1