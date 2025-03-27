import React, { useState, useRef, useEffect } from 'react'
import { Stage, Layer, Rect, Circle, Line, Arrow, Text, Group, Ellipse, Arc } from 'react-konva'
import './App.css'

function App() {
  const [activeTool, setActiveTool] = useState(null) // null, player, line, arrow, box, circle, delete, football, cone
  const [color, setColor] = useState('#FF0000') // default red
  const [shapes, setShapes] = useState([])
  const [players, setPlayers] = useState([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [newShape, setNewShape] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [selectedItems, setSelectedItems] = useState([])
  const [selectionBox, setSelectionBox] = useState(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [playerNumbers, setPlayerNumbers] = useState({})
  const [showNumberEditor, setShowNumberEditor] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [newPlayerNumber, setNewPlayerNumber] = useState('')
  const [newPlayerName, setNewPlayerName] = useState('')
  const [showConsole, setShowConsole] = useState(false)
  const [consoleInput, setConsoleInput] = useState('')
  const [consoleHistory, setConsoleHistory] = useState([])
  const [history, setHistory] = useState([{ shapes: [], players: [], playerNumbers: {} }])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [verticalOrientation, setVerticalOrientation] = useState(false)
  const [actionTaken, setActionTaken] = useState(false)
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })
  const [showFormationDropdown, setShowFormationDropdown] = useState(false)
  const [isHomeTeam, setIsHomeTeam] = useState(true)
  const [homeTeamColor, setHomeTeamColor] = useState(null)
  const [awayTeamColor, setAwayTeamColor] = useState(null)
  const [moveBlockActive, setMoveBlockActive] = useState(false)
  const [movingTeam, setMovingTeam] = useState(null) // 'home' or 'away'
  const [defaultBallId, setDefaultBallId] = useState(null) // Store the ID of the default ball
  
  // New team dialog states
  const [showTeamDialog, setShowTeamDialog] = useState(false)
  const [teamDialogData, setTeamDialogData] = useState({
    numbers: Array(11).fill('').map((_, i) => (i + 1).toString()),
    names: Array(11).fill(''),
    formation: '442',
    side: 'left',
    teamColor: '#FF0000'
  })
  
  // Edit modes
  const [editMode, setEditMode] = useState(null) // null, 'team', 'player'
  
  // Player edit dialog
  const [showPlayerEditDialog, setShowPlayerEditDialog] = useState(false)
  const [editingPlayerData, setEditingPlayerData] = useState({
    id: '',
    number: '',
    name: ''
  })
  
  // Save/Load functionality
  const [viewMode, setViewMode] = useState('board') // 'board', 'save', 'load'
  const [savedBoards, setSavedBoards] = useState([])
  const [currentSaveName, setCurrentSaveName] = useState('')
  const [selectedSaveIndex, setSelectedSaveIndex] = useState(-1)
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // FIFA standard pitch ratio is approximately 105:68 (length:width)
  const pitchRatio = 105 / 68

  // Sidebar width estimate
  const sidebarWidth = 240; // 200px + padding
  const headerHeight = 60; // Estimate for the h1 heading

  // Determine stage dimensions based on orientation and available space
  const getStageDimensions = () => {
    // Available space calculation
    const availableWidth = windowDimensions.width - sidebarWidth - 40; // 40px for padding
    const availableHeight = windowDimensions.height - headerHeight - 40; // 40px for padding
    
    if (verticalOrientation) {
      // In vertical orientation, width is shorter dimension, height is longer
      // First try to size based on width
      const widthBasedHeight = availableWidth * pitchRatio;
      
      if (widthBasedHeight <= availableHeight) {
        // If it fits, use width-based dimensions
        return { width: availableWidth, height: widthBasedHeight };
      } else {
        // If too tall, constrain by height instead
        return { width: availableHeight / pitchRatio, height: availableHeight };
      }
    } else {
      // In horizontal orientation, width is longer dimension, height is shorter
      // First try to size based on width
      const widthBasedHeight = availableWidth / pitchRatio;
      
      if (widthBasedHeight <= availableHeight) {
        // If it fits, use width-based dimensions
        return { width: availableWidth, height: widthBasedHeight };
      } else {
        // If too tall, constrain by height instead
        return { width: availableHeight * pitchRatio, height: availableHeight };
      }
    }
  };

  // Use state for stage dimensions to make it reactive
  const [stageDimensions, setStageDimensions] = useState(getStageDimensions())
  const stageWidth = stageDimensions.width
  const stageHeight = stageDimensions.height
  
  // Update stage dimensions when window size or orientation changes
  useEffect(() => {
    const newDimensions = getStageDimensions();
    setStageDimensions(newDimensions);
  }, [windowDimensions, verticalOrientation]);
  
  // Initialize the previous dimensions ref after the first render
  useEffect(() => {
    if (prevStageDimensionsRef.current.width === 0) {
      prevStageDimensionsRef.current = { ...stageDimensions };
    }
  }, [stageDimensions]);

  const playerRadius = 15
  const stageRef = useRef(null)
  const consoleInputRef = useRef(null)
  const prevStageDimensionsRef = useRef({ width: 0, height: 0 })

  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Scale elements when stage dimensions change due to window resize
  useEffect(() => {
    const prevDimensions = prevStageDimensionsRef.current;
    const { width: currentWidth, height: currentHeight } = stageDimensions;
    
    // Skip initial render and only scale when we have elements to scale
    // and when the dimensions actually change
    if (prevDimensions.width > 0 && prevDimensions.height > 0 && 
        (currentWidth !== prevDimensions.width || currentHeight !== prevDimensions.height) &&
        (players.length > 0 || shapes.length > 0)) {
      
      // Calculate scale factors
      const widthScale = currentWidth / prevDimensions.width;
      const heightScale = currentHeight / prevDimensions.height;
      
      // Only proceed if there's an actual change in dimensions
      if (widthScale !== 1 || heightScale !== 1) {
        console.log('Scaling elements to match new pitch size', widthScale, heightScale);
        // Scale players
        if (players.length > 0) {
          const scaledPlayers = players.map(player => ({
            ...player,
            x: player.x * widthScale,
            y: player.y * heightScale
          }));
          setPlayers(scaledPlayers);
        }
        
        // Scale shapes (football, cones, lines, arrows, etc.)
        if (shapes.length > 0) {
          const scaledShapes = shapes.map(shape => {
            // Handle different shape types
            if (shape.type === 'line' || shape.type === 'arrow') {
              // Transform points for lines and arrows
              const transformedPoints = [];
              for (let i = 0; i < shape.points.length; i += 2) {
                transformedPoints.push(
                  shape.points[i] * widthScale,
                  shape.points[i + 1] * heightScale
                );
              }
              return { ...shape, points: transformedPoints };
            } else if (shape.type === 'box') {
              // Scale box coordinates and dimensions
              return {
                ...shape,
                x: shape.x * widthScale,
                y: shape.y * heightScale,
                width: shape.width * widthScale,
                height: shape.height * heightScale
              };
            } else if (shape.type === 'circle') {
              // Scale circle coordinates and dimensions
              return {
                ...shape,
                x: shape.x * widthScale,
                y: shape.y * heightScale,
                width: shape.width * widthScale,
                height: shape.height * heightScale
              };
            } else if (shape.type === 'football' || shape.type === 'cone') {
              // Scale position and optionally radius for balls and cones
              return {
                ...shape,
                x: shape.x * widthScale,
                y: shape.y * heightScale,
                radius: shape.radius * Math.min(widthScale, heightScale) // Use minimum scale for consistent appearance
              };
            }
            return shape;
          });
          setShapes(scaledShapes);
        }
      }
    }
    
    // Update previous dimensions for next resize
    prevStageDimensionsRef.current = { ...stageDimensions };
  }, [stageDimensions]);

  // Add default ball in the center of the pitch
  useEffect(() => {
    // Only add the ball if there are no balls already (initial load)
    if (shapes.length === 0) {
      const dimensions = getStageDimensions();
      const ballId = `football-default-${Date.now()}`;
      const defaultBall = {
        id: ballId,
        x: dimensions.width / 2,
        y: dimensions.height / 2,
        radius: 10,
        color: '#FFFFFF',
        type: 'football',
        isDefault: true
      };
      setShapes([defaultBall]);
      setDefaultBallId(ballId);
      setActionTaken(true);
    }
  }, []);

  // Save state to history when a meaningful action is taken
  useEffect(() => {
    if (actionTaken) {
      const currentState = {
        shapes: [...shapes],
        players: [...players],
        playerNumbers: {...playerNumbers}
      }
      
      // If we're not at the end of history (user did undo), trim future states
      if (historyIndex < history.length - 1) {
        const newHistory = history.slice(0, historyIndex + 1)
        setHistory([...newHistory, currentState])
      } else {
        // Add to history
        setHistory([...history, currentState])
      }
      
      setHistoryIndex(historyIndex + 1)
      setActionTaken(false)
    }
  }, [actionTaken])

  useEffect(() => {
    // Focus the console input when it becomes visible
    if (showConsole && consoleInputRef.current) {
      consoleInputRef.current.focus()
    }
  }, [showConsole])

  const getNextPlayerNumber = (playerColor) => {
    // Get all player numbers of this color
    const colorPlayers = players.filter(p => p.color === playerColor)
    const usedNumbers = colorPlayers.map(p => playerNumbers[p.id] || 0)
    
    // Find the lowest unused number starting from 1
    let nextNumber = 1
    while (usedNumbers.includes(nextNumber)) {
      nextNumber++
    }
    
    return nextNumber
  }

  const handleToolToggle = (tool) => {
    if (activeTool === tool) {
      // Toggle off if already active
      setActiveTool(null)
      // Clear selection when deactivating the select tool
      if (tool === 'select') {
        setSelectedItems([])
      }
    } else {
      // Toggle on if not active
      setActiveTool(tool)
      
      // Clear selection when switching to a different tool
      if (activeTool === 'select' && tool !== 'select') {
        setSelectedItems([])
      }
    }
    // Clear edit mode when switching tools
    setEditMode(null)
    setSelectedId(null)
  }

  const handleEditModeToggle = (mode) => {
    if (editMode === mode) {
      // Toggle off if already active
      setEditMode(null)
    } else {
      // Toggle on if not active
      setEditMode(mode)
      // Clear any active tool
      setActiveTool(null)
    }
  }

  const handleColorChange = (newColor) => {
    setColor(newColor);
    
    // If a team is selected but doesn't have a color yet, assign this color to the team
    if (isHomeTeam && !homeTeamColor) {
      setHomeTeamColor(newColor);
    } else if (!isHomeTeam && !awayTeamColor) {
      setAwayTeamColor(newColor);
    }
  }

  const handleMouseDown = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage()
    const pos = e.target.getStage().getPointerPosition()
    
    // If clicked on an object or background
    if (!clickedOnEmpty) {
      const targetId = e.target.id()
      const parentId = e.target.getParent()?.attrs?.id
      const id = parentId || targetId // Use parent ID for text (numbers)

      // If in delete mode and clicked on an object
      if (activeTool === 'delete' && id) {
        handleDeleteItem(id)
        return
      }
      
      // Handle edit team mode
      if (editMode === 'team' && id && id.startsWith('player')) {
        const player = players.find(p => p.id === id)
        if (player) {
          handleEditTeam(player.color)
          return
        }
      }
      
      // Handle edit player mode
      if (editMode === 'player' && id && id.startsWith('player')) {
        const player = players.find(p => p.id === id)
        if (player) {
          handleEditPlayer(player)
          return
        }
      }
      
      // Handle select tool
      if (activeTool === 'select') {
        if (e.evt.shiftKey) {
          // Shift key still works for removing selected items
          if (selectedItems.includes(id)) {
            // Remove from selection if already included
            setSelectedItems(selectedItems.filter(item => item !== id))
          }
        } else {
          // Without shift, just add to selection
          if (!selectedItems.includes(id)) {
            // Add to selection if not already included
            setSelectedItems([...selectedItems, id])
          }
        }
        
        // Always set the selected ID for visual feedback
        setSelectedId(id)
        return
      }
      
      // Select the clicked object if not using a drawing tool
      if (!activeTool || activeTool === 'delete' || activeTool === 'select') {
        setSelectedId(id)
        
        // If in select mode and shift key is pressed, add to selection
        if (activeTool === 'select') {
          if (e.evt.shiftKey) {
            // Add to selection if not already included
            if (!selectedItems.includes(id)) {
              setSelectedItems([...selectedItems, id])
            }
          } else {
            // Start new selection
            setSelectedItems([id])
          }
        } else {
          // Clear multi-selection if not in select mode
          setSelectedItems([])
        }
        
        return
      }
    } else {
      // Clicked on empty area
      if (!activeTool) {
        // If no tool is active, just deselect
        setSelectedId(null)
        setSelectedItems([])
        return
      }
      
      // If in select mode, start selection box
      if (activeTool === 'select') {
        setIsSelecting(true)
        setSelectionBox({
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0
        })
        
        // Clear selection unless shift is pressed
        if (!e.evt.shiftKey) {
          setSelectedItems([])
          setSelectedId(null)
        }
        
        return
      }
      
      // Check if we're in move block mode
      if (moveBlockActive && !isDrawing) {
        // Find all players of the moving team
        const playersToSelect = players.filter(p => {
          return p.color === (movingTeam === 'home' ? homeTeamColor : awayTeamColor)
        })
        
        // Select them all
        setSelectedItems(playersToSelect.map(p => p.id))
        
        // Start dragging
        setIsDrawing(true)
        return
      }
    }

    // Handle adding/drawing with active tools
    if (activeTool && (clickedOnEmpty || activeTool !== 'delete')) {
      
      if (activeTool === 'player') {
        const nextNumber = getNextPlayerNumber(color)
        const newPlayer = {
          id: `player-${players.length}-${Date.now()}`,
          x: pos.x,
          y: pos.y,
          radius: playerRadius,
          color: color,
          type: 'player'
        }
        setPlayers([...players, newPlayer])
        setPlayerNumbers({
          ...playerNumbers,
          [newPlayer.id]: nextNumber
        })
        setActionTaken(true) // Mark that an action was taken
        return
      }
      
      if (activeTool === 'football') {
        const newBall = {
          id: `football-${shapes.length}-${Date.now()}`,
          x: pos.x,
          y: pos.y,
          radius: 10,
          color: '#FFFFFF',
          type: 'football'
        }
        setShapes([...shapes, newBall])
        setActionTaken(true) // Mark that an action was taken
        return
      }
      
      if (activeTool === 'cone') {
        // Add a cone shape
        const newCone = {
          id: `cone-${shapes.length}-${Date.now()}`,
          x: pos.x,
          y: pos.y,
          color: '#FFFF00', // Yellow default for cone
          strokeColor: '#000000', // Black outline
          type: 'cone'
        }
        setShapes([...shapes, newCone])
        setActionTaken(true) // Mark that an action was taken
        return
      }

      // For drawing tools
      setIsDrawing(true)
      if (activeTool === 'line' || activeTool === 'arrow') {
        const newLine = {
          id: `${activeTool}-${shapes.length}-${Date.now()}`,
          points: [pos.x, pos.y, pos.x, pos.y],
          color: color,
          type: activeTool
        }
        setNewShape(newLine)
      } else if (activeTool === 'box') {
        const newBox = {
          id: `box-${shapes.length}-${Date.now()}`,
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          color: color,
          type: 'box'
        }
        setNewShape(newBox)
      } else if (activeTool === 'circle') {
        const newCircle = {
          id: `circle-${shapes.length}-${Date.now()}`,
          x: pos.x, // Starting x (left edge)
          y: pos.y, // Starting y (top edge)
          width: 0,
          height: 0,
          color: color,
          type: 'circle'
        }
        setNewShape(newCircle)
      }
    }
  }

  const handleMouseMove = (e) => {
    const pos = e.target.getStage().getPointerPosition()
    
    // Handle selection box
    if (isSelecting && activeTool === 'select') {
      setSelectionBox({
        ...selectionBox,
        width: pos.x - selectionBox.x,
        height: pos.y - selectionBox.y
      })
      return
    }
    
    // Handle shape drawing
    if (!isDrawing) return
    
    if (activeTool === 'line' || activeTool === 'arrow') {
      const updatedLine = {
        ...newShape,
        points: [newShape.points[0], newShape.points[1], pos.x, pos.y]
      }
      setNewShape(updatedLine)
    } else if (activeTool === 'box') {
      const updatedBox = {
        ...newShape,
        width: pos.x - newShape.x,
        height: pos.y - newShape.y
      }
      setNewShape(updatedBox)
    } else if (activeTool === 'circle') {
      // Update width and height as we drag, just like the box
      const updatedCircle = {
        ...newShape,
        width: pos.x - newShape.x,
        height: pos.y - newShape.y
      }
      setNewShape(updatedCircle)
    }
  }

  const handleMouseUp = (e) => {
    // Handle finishing the selection box
    if (isSelecting && activeTool === 'select') {
      setIsSelecting(false)
      
      // Normalize the selection box coordinates
      const box = normalizeSelectionBox(selectionBox)
      
      // Find all items within the selection box
      const selectedPlayerIds = players.filter(player => 
        isInSelectionBox(player.x, player.y, box)
      ).map(player => player.id)
      
      const selectedShapeIds = shapes.filter(shape => {
        if (shape.type === 'line' || shape.type === 'arrow') {
          // For lines/arrows, check if any point is in the box
          for (let i = 0; i < shape.points.length; i += 2) {
            if (isInSelectionBox(shape.points[i], shape.points[i + 1], box)) {
              return true
            }
          }
          return false
        } else if (shape.type === 'box' || shape.type === 'circle') {
          // For box/circle, check if center is in the box
          const centerX = shape.x + (shape.width / 2)
          const centerY = shape.y + (shape.height / 2)
          return isInSelectionBox(centerX, centerY, box)
        } else if (shape.type === 'football') {
          // For football, check if center is in the box
          return isInSelectionBox(shape.x, shape.y, box)
        }
        return false
      }).map(shape => shape.id)
      
      // Combine existing and new selections if shift key is pressed
      const newSelection = e.evt.shiftKey 
        ? [...new Set([...selectedItems, ...selectedPlayerIds, ...selectedShapeIds])]
        : [...selectedPlayerIds, ...selectedShapeIds]
      
      setSelectedItems(newSelection)
      
      // Clear the selection box
      setSelectionBox(null)
      return
    }
    
    if (!isDrawing) return
    
    setIsDrawing(false)
    
    if (newShape) {
      setShapes([...shapes, newShape])
      setNewShape(null)
      setActionTaken(true) // Mark that an action was taken
    }
  }
  
  // Helper function to normalize selection box coords (handle negative width/height)
  const normalizeSelectionBox = (box) => {
    return {
      x: box.width >= 0 ? box.x : box.x + box.width,
      y: box.height >= 0 ? box.y : box.y + box.height,
      width: Math.abs(box.width),
      height: Math.abs(box.height)
    }
  }
  
  // Helper function to check if a point is inside the selection box
  const isInSelectionBox = (x, y, box) => {
    return x >= box.x && x <= box.x + box.width && 
           y >= box.y && y <= box.y + box.height
  }

  const handleDragStart = (e) => {
    const id = e.target.id();
    setSelectedId(id);
    
    // If this is part of a multi-selection, ensure it stays in the selection
    if (activeTool === 'select' && !selectedItems.includes(id)) {
      setSelectedItems([...selectedItems, id]);
    }
    
    // If move block is active, find the initial positions of all team players
    if (moveBlockActive && id.startsWith('player')) {
      // Find the player being dragged
      const draggedPlayer = players.find(p => p.id === id);
      if (!draggedPlayer) return;
      
      // Get the current team's color
      const teamColor = isHomeTeam ? homeTeamColor : awayTeamColor;
      
      // Only move if this player belongs to the team we're moving
      if (draggedPlayer.color === teamColor) {
        // Don't continue if this is the goalkeeper
        if (draggedPlayer.isGoalkeeper) return;
      }
    }
  };

  const handleDragEnd = (e) => {
    const id = e.target.id();
    
    if (id.startsWith('player')) {
      // Find the player that was dragged
      const draggedPlayer = players.find(p => p.id === id);
      if (!draggedPlayer) return;
      
      // Get the delta movement
      const deltaX = e.target.x() - draggedPlayer.x;
      const deltaY = e.target.y() - draggedPlayer.y;
      
      if (moveBlockActive) {
        // Handle team block movement logic (existing code)
        const teamColor = isHomeTeam ? homeTeamColor : awayTeamColor;
        
        // Make sure this player belongs to the team we're moving
        if (draggedPlayer.color === teamColor) {
          // Don't move if this is the goalkeeper
          if (draggedPlayer.isGoalkeeper) {
            // Reset position for goalkeeper if tried to move
            const updatedPlayers = players.map(player => {
              if (player.id === id) {
                return {
                  ...player,
                  x: player.x, // Keep original position
                  y: player.y  // Keep original position
                };
              }
              return player;
            });
            setPlayers(updatedPlayers);
            return;
          }
          
          // Move all players of the same team except goalkeeper
          const updatedPlayers = players.map(player => {
            if (player.color === draggedPlayer.color && !player.isGoalkeeper) {
              return {
                ...player,
                x: player.x + deltaX,
                y: player.y + deltaY
              };
            }
            return player;
          });
          
          setPlayers(updatedPlayers);
          setActionTaken(true);
        } else {
          // If not in the correct team, just move the individual player
          const updatedPlayers = players.map(player => {
            if (player.id === id) {
              return {
                ...player,
                x: e.target.x(),
                y: e.target.y()
              };
            }
            return player;
          });
          setPlayers(updatedPlayers);
          setActionTaken(true);
        }
      } else if (activeTool === 'select' && selectedItems.length > 1 && selectedItems.includes(id)) {
        // Handle multi-selection movement
        
        // Update players
        const updatedPlayers = players.map(player => {
          if (selectedItems.includes(player.id)) {
            return {
              ...player,
              x: player.x + deltaX,
              y: player.y + deltaY
            };
          }
          return player;
        });
        
        // Update shapes
        const updatedShapes = shapes.map(shape => {
          if (selectedItems.includes(shape.id)) {
            if (shape.type === 'line' || shape.type === 'arrow') {
              // For lines/arrows, move all points
              const newPoints = [...shape.points];
              for (let i = 0; i < newPoints.length; i += 2) {
                newPoints[i] += deltaX;
                newPoints[i + 1] += deltaY;
              }
              return { ...shape, points: newPoints };
            } else if (shape.type === 'box' || shape.type === 'football') {
              // For box/football, move x and y
              return { 
                ...shape, 
                x: e.target.x(), 
                y: e.target.y()
              };
            } else if (shape.type === 'circle') {
              // For circles, we need to adjust the position as it's based on center point
              return {
                ...shape,
                x: e.target.x() - shape.width / 2,
                y: e.target.y() - shape.height / 2
              };
            }
          }
          return shape;
        });
        
        setPlayers(updatedPlayers);
        setShapes(updatedShapes);
        setActionTaken(true);
      } else {
        // Normal drag for a single player
        const updatedPlayers = players.map(player => {
          if (player.id === id) {
            return {
              ...player,
              x: e.target.x(),
              y: e.target.y()
            };
          }
          return player;
        });
        setPlayers(updatedPlayers);
        setActionTaken(true);
      }
    } else {
      // Handle dragging shapes (non-players)
      const draggedShape = shapes.find(s => s.id === id);
      if (!draggedShape) return;
      
      // Get the delta movement
      let deltaX, deltaY;
      
      if (draggedShape.type === 'line' || draggedShape.type === 'arrow') {
        // For lines, calculate movement based on first point
        deltaX = e.target.points()[0] - draggedShape.points[0];
        deltaY = e.target.points()[1] - draggedShape.points[1];
      } else {
        // For other shapes
        deltaX = e.target.x() - draggedShape.x;
        deltaY = e.target.y() - draggedShape.y;
      }
      
      if (activeTool === 'select' && selectedItems.length > 1 && selectedItems.includes(id)) {
        // Handle multi-selection movement for shapes
        
        // Update players
        const updatedPlayers = players.map(player => {
          if (selectedItems.includes(player.id)) {
            return {
              ...player,
              x: player.x + deltaX,
              y: player.y + deltaY
            };
          }
          return player;
        });
        
        // Update shapes
        const updatedShapes = shapes.map(shape => {
          if (selectedItems.includes(shape.id)) {
            if (shape.type === 'line' || shape.type === 'arrow') {
              // For lines/arrows, move all points
              const newPoints = [...shape.points];
              for (let i = 0; i < newPoints.length; i += 2) {
                newPoints[i] += deltaX;
                newPoints[i + 1] += deltaY;
              }
              return { ...shape, points: newPoints };
            } else if (shape.type === 'box' || shape.type === 'football') {
              // For box/football, move x and y
              return { 
                ...shape, 
                x: e.target.x(), 
                y: e.target.y()
              };
            } else if (shape.type === 'circle') {
              // For circles, we need to adjust the position as it's based on center point
              return {
                ...shape,
                x: e.target.x() - shape.width / 2,
                y: e.target.y() - shape.height / 2
              };
            }
          }
          return shape;
        });
        
        setPlayers(updatedPlayers);
        setShapes(updatedShapes);
        setActionTaken(true);
      } else {
        // Single shape drag
        const updatedShapes = shapes.map(shape => {
          if (shape.id === id) {
            if (shape.type === 'line' || shape.type === 'arrow') {
              // For lines/arrows, move all points
              const newPoints = [...shape.points];
              for (let i = 0; i < newPoints.length; i += 2) {
                newPoints[i] += deltaX;
                newPoints[i + 1] += deltaY;
              }
              return { ...shape, points: newPoints };
            } else if (shape.type === 'box' || shape.type === 'football') {
              // For box/football, move x and y
              return { 
                ...shape, 
                x: e.target.x(), 
                y: e.target.y()
              };
            } else if (shape.type === 'circle') {
              // For circles, we need to adjust the position as it's based on center point
              return {
                ...shape,
                x: e.target.x() - shape.width / 2,
                y: e.target.y() - shape.height / 2
              };
            }
          }
          return shape;
        });
        
        setShapes(updatedShapes);
        setActionTaken(true);
      }
    }
  };

  const handleDeleteItem = (id) => {
    if (!id) return
    
    // Prevent deletion of the default ball
    if (id === defaultBallId) {
      return;
    }
    
    if (id.startsWith('player')) {
      const updatedPlayers = players.filter(player => player.id !== id)
      setPlayers(updatedPlayers)
    } else {
      const updatedShapes = shapes.filter(shape => shape.id !== id)
      setShapes(updatedShapes)
    }
    
    setSelectedId(null)
    setActionTaken(true) // Mark that an action was taken
  }

  const handleDelete = () => {
    // Toggle delete tool
    handleToolToggle('delete')
  }

  const handleClear = () => {
    // Keep the default ball when clearing
    const defaultBall = shapes.find(shape => shape.id === defaultBallId);
    setShapes(defaultBall ? [defaultBall] : []);
    setPlayers([]);
    setPlayerNumbers({});
    setSelectedId(null);
    setActionTaken(true); // Mark that an action was taken
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const previousState = history[newIndex]
      
      // Get shapes from history, but ensure the default ball is preserved
      let newShapes = [...previousState.shapes];
      const defaultBallInHistory = newShapes.find(shape => shape.id === defaultBallId);
      
      // If default ball is missing from history state, get it from current state
      if (!defaultBallInHistory && defaultBallId) {
        const currentDefaultBall = shapes.find(shape => shape.id === defaultBallId);
        if (currentDefaultBall) {
          newShapes.push(currentDefaultBall);
        }
      }
      
      setShapes(newShapes)
      setPlayers(previousState.players)
      setPlayerNumbers(previousState.playerNumbers)
      setHistoryIndex(newIndex)
      setSelectedId(null)
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      const nextState = history[newIndex]
      
      // Get shapes from history, but ensure the default ball is preserved
      let newShapes = [...nextState.shapes];
      const defaultBallInHistory = newShapes.find(shape => shape.id === defaultBallId);
      
      // If default ball is missing from history state, get it from current state
      if (!defaultBallInHistory && defaultBallId) {
        const currentDefaultBall = shapes.find(shape => shape.id === defaultBallId);
        if (currentDefaultBall) {
          newShapes.push(currentDefaultBall);
        }
      }
      
      setShapes(newShapes)
      setPlayers(nextState.players)
      setPlayerNumbers(nextState.playerNumbers)
      setHistoryIndex(newIndex)
      setSelectedId(null)
    }
  }

  const toggleOrientation = () => {
    // Get current dimensions before toggling
    const oldDimensions = getStageDimensions();
    const oldWidth = oldDimensions.width;
    const oldHeight = oldDimensions.height;
    
    // Toggle orientation
    setVerticalOrientation(!verticalOrientation);
    
    // Calculate new dimensions after toggling
    const willBeVertical = !verticalOrientation;
    const tempDimensions = willBeVertical ? 
      { width: oldHeight, height: oldWidth } : 
      { width: oldHeight, height: oldWidth };
    
    // Transform existing elements
    if (shapes.length > 0 || players.length > 0) {
      // Transform shapes
      const transformedShapes = shapes.map(shape => {
        if (shape.type === 'line' || shape.type === 'arrow') {
          // Transform points for lines and arrows
          const transformedPoints = [];
          for (let i = 0; i < shape.points.length; i += 2) {
            const x = shape.points[i];
            const y = shape.points[i + 1];
            
            // Normalize coordinates
            const normalizedX = x / oldWidth;
            const normalizedY = y / oldHeight;
            
            if (willBeVertical) {
              // Horizontal to vertical - rotate 90 degrees clockwise
              transformedPoints.push(
                tempDimensions.width * normalizedY,
                tempDimensions.height * (1 - normalizedX)
              );
            } else {
              // Vertical to horizontal - rotate 90 degrees counterclockwise
              transformedPoints.push(
                tempDimensions.width * (1 - normalizedY),
                tempDimensions.height * normalizedX
              );
            }
          }
          return { ...shape, points: transformedPoints };
        } else if (shape.type === 'box' || shape.type === 'circle') {
          // Normalize coordinates
          const normalizedX = shape.x / oldWidth;
          const normalizedY = shape.y / oldHeight;
          const normalizedWidth = shape.width / oldWidth;
          const normalizedHeight = shape.height / oldHeight;
          
          if (willBeVertical) {
            // Horizontal to vertical - rotate 90 degrees clockwise
            return {
              ...shape,
              x: tempDimensions.width * normalizedY,
              y: tempDimensions.height * (1 - normalizedX - normalizedWidth),
              width: tempDimensions.width * normalizedHeight,
              height: tempDimensions.height * normalizedWidth
            };
          } else {
            // Vertical to horizontal - rotate 90 degrees counterclockwise
            return {
              ...shape,
              x: tempDimensions.width * (1 - normalizedY - normalizedHeight),
              y: tempDimensions.height * normalizedX,
              width: tempDimensions.width * normalizedHeight,
              height: tempDimensions.height * normalizedWidth
            };
          }
        }
        return shape;
      });

      // Transform players
      const transformedPlayers = players.map(player => {
        // Normalize coordinates
        const normalizedX = player.x / oldWidth;
        const normalizedY = player.y / oldHeight;
        
        if (willBeVertical) {
          // Horizontal to vertical - rotate 90 degrees clockwise
          return {
            ...player,
            x: tempDimensions.width * normalizedY,
            y: tempDimensions.height * (1 - normalizedX)
          };
        } else {
          // Vertical to horizontal - rotate 90 degrees counterclockwise
          return {
            ...player,
            x: tempDimensions.width * (1 - normalizedY),
            y: tempDimensions.height * normalizedX
          };
        }
      });

      setShapes(transformedShapes);
      setPlayers(transformedPlayers);
      setActionTaken(true);
    }
  }

  const openNumberEditor = () => {
    if (selectedId && selectedId.startsWith('player')) {
      const player = players.find(p => p.id === selectedId)
      if (player) {
        setEditingPlayer(player)
        
        // Handle both old and new format for player numbers
        if (typeof playerNumbers[player.id] === 'object') {
          setNewPlayerNumber(playerNumbers[player.id]?.number || '')
          setNewPlayerName(playerNumbers[player.id]?.name || '')
        } else {
          setNewPlayerNumber(playerNumbers[player.id]?.toString() || '')
          setNewPlayerName('')
        }
        
        setShowNumberEditor(true)
      }
    } else {
      // If no player is selected, show an info message
      console.log('Please select a player first to edit its number')
    }
  }

  const handleNumberChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    setNewPlayerNumber(value)
  }

  const handleNameChange = (e) => {
    setNewPlayerName(e.target.value)
  }

  const handleNumberSubmit = (e) => {
    e.preventDefault()
    if (editingPlayer && newPlayerNumber) {
      // Handle both old and new format
      if (typeof playerNumbers[editingPlayer.id] === 'object') {
        setPlayerNumbers({
          ...playerNumbers,
          [editingPlayer.id]: {
            ...playerNumbers[editingPlayer.id],
            number: newPlayerNumber,
            name: newPlayerName
          }
        })
      } else {
        setPlayerNumbers({
          ...playerNumbers,
          [editingPlayer.id]: {
            number: newPlayerNumber,
            name: newPlayerName
          }
        })
      }
      setActionTaken(true) // Mark that an action was taken
    }
    setShowNumberEditor(false)
    setEditingPlayer(null)
  }

  const handleKeyDown = (e) => {
    // Handle delete key for selected shapes/players
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedId) {
        handleDeleteItem(selectedId)
      }
    }

    // Toggle console with backtick key
    if (e.key === '`' && !showNumberEditor) {
      setShowConsole(prev => !prev)
      e.preventDefault()
    }
  }

  const handleConsoleInput = (e) => {
    setConsoleInput(e.target.value)
  }

  const handleConsoleSubmit = (e) => {
    e.preventDefault()
    if (consoleInput.trim()) {
      const newEntry = {
        type: 'feedback',
        text: consoleInput,
        timestamp: new Date().toLocaleTimeString()
      }
      
      // Log to console for the developer
      console.log('User Feedback:', consoleInput)
      
      // Add to console history
      setConsoleHistory(prev => [...prev, newEntry])
      setConsoleInput('')
    }
  }

  // Function to place players in formation
  const placePlayersInFormation = (formation) => {
    // Clear any existing players with the current color
    const filteredPlayers = players.filter(player => player.color !== color);
    
    // Calculate positions based on orientation and home/away
    const positions = getFormationPositions(formation, isHomeTeam, verticalOrientation);
    
    // Create new players
    const newPlayers = positions.map((pos, index) => {
      const playerId = `player-${filteredPlayers.length + index}-${Date.now() + index}`;
      return {
        id: playerId,
        x: pos.x * stageWidth,
        y: pos.y * stageHeight,
        radius: playerRadius,
        color: color,
        type: 'player',
        team: isHomeTeam ? 'home' : 'away', // Tag the player with team
        isGoalkeeper: index === 0 // First player is always the goalkeeper
      };
    });

    // Create player numbers
    const newPlayerNumbers = {};
    // Standard football jersey numbers for different formations
    let jerseyNumbers;
    
    switch(formation) {
      case '442':
        jerseyNumbers = [1, 2, 5, 6, 3, 7, 4, 8, 11, 9, 10];
        break;
      case '433':
        jerseyNumbers = [1, 2, 5, 6, 3, 4, 8, 10, 7, 9, 11];
        break;
      case '4231':
        jerseyNumbers = [1, 2, 5, 6, 3, 4, 8, 7, 11, 10, 9];
        break;
      case '532':
        jerseyNumbers = [1, 2, 5, 6, 3, 4, 7, 8, 10, 9, 11];
        break;
      default:
        jerseyNumbers = Array.from({length: 11}, (_, i) => i + 1);
    }
    
    newPlayers.forEach((player, index) => {
      newPlayerNumbers[player.id] = jerseyNumbers[index];
    });

    // Set players and numbers
    setPlayers([...filteredPlayers, ...newPlayers]);
    setPlayerNumbers({...playerNumbers, ...newPlayerNumbers});
    
    // Save the team color
    if (isHomeTeam) {
      setHomeTeamColor(color);
    } else {
      setAwayTeamColor(color);
    }
    
    setActionTaken(true);
    setShowFormationDropdown(false);
  };

  // Get normalized positions (0-1) for each formation
  const getFormationPositions = (formation, isHome, isVertical) => {
    // Base positions with the team attacking from left to right (horizontal)
    // These are normalized coordinates (0-1) that will be multiplied by stage dimensions
    let positions;
    
    switch(formation) {
      case '442':
        positions = [
          {x: 0.08, y: 0.5},  // GK
          {x: 0.2, y: 0.2},   // RB
          {x: 0.2, y: 0.4},   // RCB
          {x: 0.2, y: 0.6},   // LCB
          {x: 0.2, y: 0.8},   // LB
          {x: 0.4, y: 0.2},   // RM
          {x: 0.4, y: 0.4},   // RCM
          {x: 0.4, y: 0.6},   // LCM
          {x: 0.4, y: 0.8},   // LM
          {x: 0.6, y: 0.4},   // RS
          {x: 0.6, y: 0.6}    // LS
        ];
        break;
      case '433':
        positions = [
          {x: 0.08, y: 0.5},  // GK
          {x: 0.2, y: 0.2},   // RB
          {x: 0.2, y: 0.4},   // RCB
          {x: 0.2, y: 0.6},   // LCB
          {x: 0.2, y: 0.8},   // LB
          {x: 0.4, y: 0.35},  // RDM
          {x: 0.4, y: 0.5},   // CDM
          {x: 0.4, y: 0.65},  // LDM
          {x: 0.65, y: 0.25}, // RW
          {x: 0.65, y: 0.5},  // CF
          {x: 0.65, y: 0.75}  // LW
        ];
        break;
      case '4231':
        positions = [
          {x: 0.08, y: 0.5},  // GK
          {x: 0.2, y: 0.2},   // RB
          {x: 0.2, y: 0.4},   // RCB
          {x: 0.2, y: 0.6},   // LCB
          {x: 0.2, y: 0.8},   // LB
          {x: 0.35, y: 0.4},  // RDM
          {x: 0.35, y: 0.6},  // LDM
          {x: 0.5, y: 0.25},  // RAM
          {x: 0.5, y: 0.5},   // CAM
          {x: 0.5, y: 0.75},  // LAM
          {x: 0.65, y: 0.5}   // ST
        ];
        break;
      case '532':
        positions = [
          {x: 0.08, y: 0.5},  // GK
          {x: 0.2, y: 0.2},   // RWB
          {x: 0.2, y: 0.35},  // RCB
          {x: 0.2, y: 0.5},   // CB
          {x: 0.2, y: 0.65},  // LCB
          {x: 0.2, y: 0.8},   // LWB
          {x: 0.4, y: 0.3},   // RCM
          {x: 0.4, y: 0.5},   // CM
          {x: 0.4, y: 0.7},   // LCM
          {x: 0.65, y: 0.4},  // RS
          {x: 0.65, y: 0.6}   // LS
        ];
        break;
      default:
        positions = [];
    }
    
    // If away team, flip horizontally
    if (!isHome) {
      positions = positions.map(pos => ({x: 1 - pos.x, y: pos.y}));
    }
    
    // If vertical orientation, swap x and y and adjust
    if (isVertical) {
      positions = positions.map(pos => {
        if (isHome) {
          // Home team plays bottom to top in vertical
          return {x: pos.y, y: 1 - pos.x};
        } else {
          // Away team plays top to bottom in vertical
          return {x: pos.y, y: pos.x};
        }
      });
    }
    
    return positions;
  };
  
  // Toggle home/away
  const toggleHomeAway = (team) => {
    if (team === 'home') {
      setIsHomeTeam(true);
      // Set the current color to the home team color if it exists
      if (homeTeamColor) {
        setColor(homeTeamColor);
      }
    } else {
      setIsHomeTeam(false);
      // Set the current color to the away team color if it exists
      if (awayTeamColor) {
        setColor(awayTeamColor);
      }
    }
  };

  // Toggle move block mode
  const toggleMoveBlock = () => {
    const team = isHomeTeam ? 'home' : 'away';
    const teamColor = isHomeTeam ? homeTeamColor : awayTeamColor;
    
    if (moveBlockActive && movingTeam === team) {
      // Turn off move block if already active for this team
      setMoveBlockActive(false);
      setMovingTeam(null);
    } else if (teamColor) {
      // Turn on move block for this team
      setMoveBlockActive(true);
      setMovingTeam(team);
      setActiveTool(null); // Deactivate any other tools
    }
  };

  const assignColorToTeam = () => {
    // Assign the currently selected color to the current team
    if (isHomeTeam) {
      setHomeTeamColor(color);
      
      // If the team already has players on the field, update their color
      if (homeTeamColor) {
        const updatedPlayers = players.map(player => {
          if (player.color === homeTeamColor) {
            return { ...player, color: color };
          }
          return player;
        });
        setPlayers(updatedPlayers);
        setActionTaken(true);
      }
    } else {
      setAwayTeamColor(color);
      
      // If the team already has players on the field, update their color
      if (awayTeamColor) {
        const updatedPlayers = players.map(player => {
          if (player.color === awayTeamColor) {
            return { ...player, color: color };
          }
          return player;
        });
        setPlayers(updatedPlayers);
        setActionTaken(true);
      }
    }
  };

  // Load saved boards from localStorage on initial render
  useEffect(() => {
    const savedData = localStorage.getItem('footballTacticsBoards')
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        setSavedBoards(parsedData)
      } catch (e) {
        console.error('Error loading saved boards:', e)
      }
    }
  }, [])

  // Save functionality
  const handleSaveClick = () => {
    setViewMode(viewMode === 'save' ? 'board' : 'save')
    setCurrentSaveName('')
    setSelectedSaveIndex(-1)
    setShowOverwriteConfirm(false)
  }

  // Load functionality
  const handleLoadClick = () => {
    setViewMode(viewMode === 'load' ? 'board' : 'load')
    setCurrentSaveName('')
    setSelectedSaveIndex(-1)
  }

  // Handle creating a new save or overwriting an existing save
  const handleSave = () => {
    if (!currentSaveName.trim()) {
      return // Don't save if name is empty
    }

    // If a save is selected and we haven't shown confirmation yet
    if (selectedSaveIndex !== -1 && !showOverwriteConfirm) {
      setShowOverwriteConfirm(true)
      return
    }

    const boardData = {
      name: currentSaveName.trim(),
      date: new Date().toISOString(),
      shapes,
      players,
      playerNumbers,
      homeTeamColor,
      awayTeamColor,
      verticalOrientation
    }

    let newSavedBoards
    if (selectedSaveIndex !== -1) {
      // Overwrite existing save
      newSavedBoards = [...savedBoards]
      newSavedBoards[selectedSaveIndex] = boardData
    } else {
      // Create new save
      newSavedBoards = [...savedBoards, boardData]
    }

    // Update state and localStorage
    setSavedBoards(newSavedBoards)
    localStorage.setItem('footballTacticsBoards', JSON.stringify(newSavedBoards))

    // Return to board view
    setViewMode('board')
    setShowOverwriteConfirm(false)
  }

  // Handle loading a board
  const handleLoad = () => {
    if (selectedSaveIndex === -1) return

    const boardData = savedBoards[selectedSaveIndex]
    
    // Load all the saved data
    setShapes(boardData.shapes || [])
    setPlayers(boardData.players || [])
    setPlayerNumbers(boardData.playerNumbers || {})
    setHomeTeamColor(boardData.homeTeamColor || null)
    setAwayTeamColor(boardData.awayTeamColor || null)
    setVerticalOrientation(boardData.verticalOrientation || false)
    
    // Find and set the default ball ID if it exists
    const defaultBall = boardData.shapes.find(shape => shape.isDefault === true)
    if (defaultBall) {
      setDefaultBallId(defaultBall.id)
    }
    
    // Return to board view
    setViewMode('board')
    setActionTaken(true)
  }

  // Select a saved board
  const handleSelectSave = (index) => {
    setSelectedSaveIndex(index)
    setCurrentSaveName(savedBoards[index].name)
    setShowOverwriteConfirm(false)
  }

  // Handle deleting a saved board
  const handleDeleteSave = () => {
    if (selectedSaveIndex === -1) return

    // If we haven't shown confirmation yet
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    // Remove the selected board
    const newSavedBoards = [...savedBoards]
    newSavedBoards.splice(selectedSaveIndex, 1)

    // Update state and localStorage
    setSavedBoards(newSavedBoards)
    localStorage.setItem('footballTacticsBoards', JSON.stringify(newSavedBoards))

    // Reset selection and hide confirmation
    setSelectedSaveIndex(-1)
    setCurrentSaveName('')
    setShowDeleteConfirm(false)
  }

  // Cancel the save/load process
  const handleCancelSaveLoad = () => {
    setViewMode('board');
    setCurrentSaveName('');
    setSelectedSaveIndex(-1);
    setShowOverwriteConfirm(false);
    setShowDeleteConfirm(false);
  }

  // Helper function to get position abbreviations based on formation and player index
  const getPositionAbbreviation = (formation, index) => {
    // Index 0 is always GK, handled separately in the UI
    switch(formation) {
      case '442':
        const positions442 = ['GK', 'RB', 'RCB', 'LCB', 'LB', 'RM', 'RCM', 'LCM', 'LM', 'RS', 'LS'];
        return positions442[index];
      case '433':
        const positions433 = ['GK', 'RB', 'RCB', 'LCB', 'LB', 'RDM', 'CDM', 'LDM', 'RW', 'CF', 'LW'];
        return positions433[index];
      case '4231':
        const positions4231 = ['GK', 'RB', 'RCB', 'LCB', 'LB', 'RDM', 'LDM', 'RAM', 'CAM', 'LAM', 'ST'];
        return positions4231[index];
      case '532':
        const positions532 = ['GK', 'RWB', 'RCB', 'CB', 'LCB', 'LWB', 'RCM', 'CM', 'LCM', 'RS', 'LS'];
        return positions532[index];
      default:
        return `P${index}`;
    }
  };

  // Team Dialog Handlers
  const openTeamDialog = () => {
    setTeamDialogData({
      numbers: Array(11).fill('').map((_, i) => (i + 1).toString()),
      names: Array(11).fill(''),
      formation: '442',
      side: 'left',
      teamColor: color
    });
    setShowTeamDialog(true);
  };

  const closeTeamDialog = () => {
    setShowTeamDialog(false);
    setEditMode(null); // Clear edit mode when closing dialog
  };

  const handleTeamDialogInputChange = (e, index, field) => {
    const newData = { ...teamDialogData };
    newData[field][index] = e.target.value;
    setTeamDialogData(newData);
  };

  const handleTeamDialogFormationChange = (formation) => {
    setTeamDialogData({ ...teamDialogData, formation });
  };

  const handleTeamDialogSideChange = (side) => {
    setTeamDialogData({ ...teamDialogData, side });
  };

  const handleTeamDialogColorChange = (teamColor) => {
    setTeamDialogData({ ...teamDialogData, teamColor });
  };

  const handleTeamDialogSubmit = () => {
    // Validate that all numbers are filled
    if (teamDialogData.numbers.some(num => !num)) {
      alert('Please enter numbers for all players');
      return;
    }

    // Clear any existing players with the current color
    const filteredPlayers = players.filter(player => player.color !== teamDialogData.teamColor);
    
    // Calculate positions based on orientation and side
    const isLeftSide = teamDialogData.side === 'left';
    const positions = getFormationPositions(teamDialogData.formation, isLeftSide, verticalOrientation);
    
    // Create new players
    const newPlayers = positions.map((pos, index) => {
      const playerId = `player-${filteredPlayers.length + index}-${Date.now() + index}`;
      return {
        id: playerId,
        x: pos.x * stageWidth,
        y: pos.y * stageHeight,
        radius: playerRadius,
        color: teamDialogData.teamColor,
        type: 'player',
        team: isLeftSide ? 'home' : 'away', // Tag the player with team
        isGoalkeeper: index === 0 // First player is always the goalkeeper
      };
    });

    // Create player numbers and names
    const newPlayerNumbers = {};
    
    newPlayers.forEach((player, index) => {
      newPlayerNumbers[player.id] = {
        number: teamDialogData.numbers[index],
        name: teamDialogData.names[index]
      };
    });

    // Set players and numbers
    setPlayers([...filteredPlayers, ...newPlayers]);
    setPlayerNumbers({...playerNumbers, ...newPlayerNumbers});
    
    // Save the team color
    if (isLeftSide) {
      setHomeTeamColor(teamDialogData.teamColor);
      setIsHomeTeam(true);
    } else {
      setAwayTeamColor(teamDialogData.teamColor);
      setIsHomeTeam(false);
    }
    
    setActionTaken(true);
    closeTeamDialog();
  };

  // Handle editing a team (when team edit mode is active)
  const handleEditTeam = (teamColor) => {
    // Find all players with this color
    const teamPlayers = players.filter(player => player.color === teamColor);
    
    if (teamPlayers.length === 0) return;
    
    // Determine team side based on first player's team property
    const isLeftSide = teamPlayers[0].team === 'home';
    
    // Get the formation by analyzing player positions
    // For simplicity, we'll just use the default formation
    const formation = '442';
    
    // Extract the player numbers and names
    const numbers = Array(11).fill('').map((_, i) => (i + 1).toString());
    const names = Array(11).fill('');
    
    teamPlayers.forEach(player => {
      const index = teamPlayers.findIndex(p => p.id === player.id);
      if (index >= 0 && index < 11) {
        // Get the player number and name
        if (typeof playerNumbers[player.id] === 'object') {
          numbers[index] = playerNumbers[player.id]?.number || '';
          names[index] = playerNumbers[player.id]?.name || '';
        } else {
          numbers[index] = playerNumbers[player.id]?.toString() || '';
        }
      }
    });
    
    // Initialize dialog data
    setTeamDialogData({
      numbers,
      names,
      formation,
      side: isLeftSide ? 'left' : 'right',
      teamColor
    });
    
    // Show the team dialog
    setShowTeamDialog(true);
  };
  
  // Handle editing a single player
  const handleEditPlayer = (player) => {
    if (!player) return;
    
    let number = '';
    let name = '';
    
    // Get the player number and name
    if (typeof playerNumbers[player.id] === 'object') {
      number = playerNumbers[player.id]?.number || '';
      name = playerNumbers[player.id]?.name || '';
    } else {
      number = playerNumbers[player.id]?.toString() || '';
    }
    
    // Set the player data
    setEditingPlayerData({
      id: player.id,
      number,
      name
    });
    
    // Show the player edit dialog
    setShowPlayerEditDialog(true);
  };
  
  // Close the player edit dialog
  const closePlayerEditDialog = () => {
    setShowPlayerEditDialog(false);
    setEditMode(null); // Clear edit mode when closing dialog
  };
  
  // Handle submitting player edit changes
  const handlePlayerEditSubmit = () => {
    const { id, number, name } = editingPlayerData;
    
    if (id && number) {
      // Update the player number and name
      setPlayerNumbers({
        ...playerNumbers,
        [id]: {
          number,
          name
        }
      });
      
      setActionTaken(true);
    }
    
    closePlayerEditDialog();
  };
  
  // Handle player edit input changes
  const handlePlayerEditInputChange = (e, field) => {
    setEditingPlayerData({
      ...editingPlayerData,
      [field]: e.target.value
    });
  };

  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };
  
  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="tactics-board" tabIndex={0} onKeyDown={handleKeyDown}>
      <h1>Football Tactics Board</h1>
      
      <div className="main-container">
        <div className="sidebar-toolbar">
          <div className="toolbar-section color-section">
            <div className="current-color-display">
              <div className="color-circle" style={{ backgroundColor: color }}></div>
            </div>
            <div className="colors-grid">
              <button 
                className={color === '#FF0000' ? 'active' : ''}
                onClick={() => handleColorChange('#FF0000')}
                style={{ backgroundColor: '#FF0000' }}
              ></button>
              <button 
                className={color === '#0000FF' ? 'active' : ''}
                onClick={() => handleColorChange('#0000FF')}
                style={{ backgroundColor: '#0000FF' }}
              ></button>
              <button 
                className={color === '#00FF00' ? 'active' : ''}
                onClick={() => handleColorChange('#00FF00')}
                style={{ backgroundColor: '#00FF00' }}
              ></button>
              <button 
                className={color === '#FFFF00' ? 'active' : ''}
                onClick={() => handleColorChange('#FFFF00')}
                style={{ backgroundColor: '#FFFF00' }}
              ></button>
              <button 
                className={color === '#000000' ? 'active' : ''}
                onClick={() => handleColorChange('#000000')}
                style={{ backgroundColor: '#000000' }}
              ></button>
              <button 
                className={color === '#FFFFFF' ? 'active' : ''}
                onClick={() => handleColorChange('#FFFFFF')}
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #333' }}
              ></button>
              <button 
                className={color === '#FFA500' ? 'active' : ''}
                onClick={() => handleColorChange('#FFA500')}
                style={{ backgroundColor: '#FFA500' }}
              ></button>
              <button 
                className={color === '#800080' ? 'active' : ''}
                onClick={() => handleColorChange('#800080')}
                style={{ backgroundColor: '#800080' }}
              ></button>
              <button 
                className="color-picker-button"
                title="Color Picker"
              >
                <input 
                  type="color" 
                  value={color}
                  onChange={(e) => handleColorChange(e.target.value)}
                />
              </button>
            </div>
          </div>
          
          <div className="toolbar-section">
            <h3>Draw</h3>
            <div className="button-row">
              <button 
                className={activeTool === 'line' ? 'active' : ''} 
                onClick={() => handleToolToggle('line')}
              >
                Line
              </button>
              <button 
                className={activeTool === 'arrow' ? 'active' : ''} 
                onClick={() => handleToolToggle('arrow')}
              >
                Arrow
              </button>
            </div>
            <div className="button-row">
              <button 
                className={activeTool === 'box' ? 'active' : ''} 
                onClick={() => handleToolToggle('box')}
              >
                Rectangle
              </button>
              <button 
                className={activeTool === 'circle' ? 'active' : ''} 
                onClick={() => handleToolToggle('circle')}
              >
                Circle
              </button>
            </div>
            <div className="button-row">
              <button 
                className={activeTool === 'cone' ? 'active' : ''} 
                onClick={() => handleToolToggle('cone')}
                style={{ width: '100%' }}
              >
                Cone
              </button>
            </div>
          </div>
          
          <div className="toolbar-section">
            <h3>Tools</h3>
            <div className="category-label">Team</div>
            <div className="button-row">
              <button onClick={openTeamDialog}>
                Add
              </button>
              <button 
                className={editMode === 'team' ? 'active' : ''}
                onClick={() => handleEditModeToggle('team')}
              >
                Edit
              </button>
            </div>
            
            <div className="category-label">Player</div>
            <div className="button-row">
              <button 
                className={activeTool === 'player' ? 'active' : ''} 
                onClick={() => handleToolToggle('player')}
              >
                Add
              </button>
              <button 
                className={editMode === 'player' ? 'active' : ''}
                onClick={() => handleEditModeToggle('player')}
              >
                Edit
              </button>
            </div>
            
            <div className="button-row">
              <button 
                className={activeTool === 'football' ? 'active' : ''} 
                onClick={() => handleToolToggle('football')}
              >
                Ball
              </button>
              <button 
                className={activeTool === 'select' ? 'active' : ''}
                onClick={() => handleToolToggle('select')}
              >
                Select
              </button>
            </div>
          </div>
          
          <div className="toolbar-section">
            <h3>Edit</h3>
            <div className="button-row">
              <button 
                className={activeTool === 'delete' ? 'active' : ''} 
                onClick={handleDelete}
              >
                Delete
              </button>
              <button onClick={handleClear}>
                Clear
              </button>
            </div>
            <div className="button-row">
              <button 
                onClick={handleUndo} 
                disabled={historyIndex <= 0}
                className={historyIndex <= 0 ? 'disabled' : ''}
              >
                Undo
              </button>
              <button 
                onClick={handleRedo} 
                disabled={historyIndex >= history.length - 1}
                className={historyIndex >= history.length - 1 ? 'disabled' : ''}
              >
                Redo
              </button>
            </div>
          </div>
          
          <div className="toolbar-section">
            <h3>Options</h3>
            <div className="button-row">
              <button 
                onClick={handleSaveClick}
                className={viewMode === 'save' ? 'active' : ''}
              >
                Save
              </button>
              <button 
                onClick={handleLoadClick}
                className={viewMode === 'load' ? 'active' : ''}
              >
                Load
              </button>
            </div>
          </div>
        </div>
        
        <div className="canvas-container" style={{ width: stageWidth, height: stageHeight }}>
          {viewMode === 'board' ? (
            <>
              <Stage
                ref={stageRef}
                width={stageWidth}
                height={stageHeight}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <Layer>
                  {/* Football pitch background */}
                  <Rect
                    x={0}
                    y={0}
                    width={stageWidth}
                    height={stageHeight}
                    fill="#4CAF50"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                  
                  {verticalOrientation ? (
                    // Vertical pitch elements
                    <>
                      {/* Center circle */}
                      <Circle
                        x={stageWidth / 2}
                        y={stageHeight / 2}
                        radius={stageWidth / 5}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                      
                      {/* Center line (horizontal for vertical field) */}
                      <Line
                        points={[0, stageHeight / 2, stageWidth, stageHeight / 2]}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                      
                      {/* Top goal area (six-yard box) */}
                      <Rect
                        x={(stageWidth - stageWidth * 0.275) / 2}
                        y={0}
                        width={stageWidth * 0.275}
                        height={stageHeight * 0.055}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                      
                      {/* Bottom goal area (six-yard box) */}
                      <Rect
                        x={(stageWidth - stageWidth * 0.275) / 2}
                        y={stageHeight - stageHeight * 0.055}
                        width={stageWidth * 0.275}
                        height={stageHeight * 0.055}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                      
                      {/* Top penalty area */}
                      <Rect
                        x={(stageWidth - stageWidth * 0.6) / 2}
                        y={0}
                        width={stageWidth * 0.6}
                        height={stageHeight * 0.16}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                      
                      {/* Bottom penalty area */}
                      <Rect
                        x={(stageWidth - stageWidth * 0.6) / 2}
                        y={stageHeight - stageHeight * 0.16}
                        width={stageWidth * 0.6}
                        height={stageHeight * 0.16}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                      
                      {/* Top penalty spot */}
                      <Circle
                        x={stageWidth / 2}
                        y={stageHeight * 0.11}
                        radius={stageWidth / 150}
                        fill="#FFFFFF"
                      />
                      
                      {/* Bottom penalty spot */}
                      <Circle
                        x={stageWidth / 2}
                        y={stageHeight - stageHeight * 0.11}
                        radius={stageWidth / 150}
                        fill="#FFFFFF"
                      />
                      
                      {/* Top penalty area 'D' arc */}
                      <Arc
                        x={stageWidth / 2}
                        y={stageHeight * 0.905}
                        innerRadius={stageWidth * 0.2}
                        outerRadius={stageWidth * 0.2}
                        angle={120}
                        rotation={210}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                      
                      {/* Bottom penalty area 'D' arc */}
                      <Arc
                        x={stageWidth / 2}
                        y={stageHeight - stageHeight * 0.905}
                        innerRadius={stageWidth * 0.2}
                        outerRadius={stageWidth * 0.2}
                        angle={120}
                        rotation={30}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                    </>
                  ) : (
                    // Horizontal pitch elements
                    <>
                      {/* Center circle */}
                      <Circle
                        x={stageWidth / 2}
                        y={stageHeight / 2}
                        radius={stageHeight / 5}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                      
                      {/* Center line */}
                      <Line
                        points={[stageWidth / 2, 0, stageWidth / 2, stageHeight]}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                      
                      {/* Left goal area (six-yard box) */}
                      <Rect
                        x={0}
                        y={(stageHeight - stageHeight * 0.275) / 2}
                        width={stageWidth * 0.055}
                        height={stageHeight * 0.275}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                      
                      {/* Right goal area (six-yard box) */}
                      <Rect
                        x={stageWidth - stageWidth * 0.055}
                        y={(stageHeight - stageHeight * 0.275) / 2}
                        width={stageWidth * 0.055}
                        height={stageHeight * 0.275}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                      
                      {/* Left penalty area */}
                      <Rect
                        x={0}
                        y={(stageHeight - stageHeight * 0.6) / 2}
                        width={stageWidth * 0.16}
                        height={stageHeight * 0.6}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                      
                      {/* Right penalty area */}
                      <Rect
                        x={stageWidth - stageWidth * 0.16}
                        y={(stageHeight - stageHeight * 0.6) / 2}
                        width={stageWidth * 0.16}
                        height={stageHeight * 0.6}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                      
                      {/* Left penalty spot */}
                      <Circle
                        x={stageWidth * 0.11}
                        y={stageHeight / 2}
                        radius={stageHeight / 150}
                        fill="#FFFFFF"
                      />
                      
                      {/* Right penalty spot */}
                      <Circle
                        x={stageWidth - stageWidth * 0.11}
                        y={stageHeight / 2}
                        radius={stageHeight / 150}
                        fill="#FFFFFF"
                      />
                      
                      {/* Left penalty area 'D' arc */}
                      <Arc
                        x={stageWidth * 0.095}
                        y={stageHeight / 2}
                        innerRadius={stageHeight * 0.2}
                        outerRadius={stageHeight * 0.2}
                        angle={120}
                        rotation={300}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                      
                      {/* Right penalty area 'D' arc */}
                      <Arc
                        x={stageWidth - stageWidth * 0.095}
                        y={stageHeight / 2}
                        innerRadius={stageHeight * 0.2}
                        outerRadius={stageHeight * 0.2}
                        angle={120}
                        rotation={120}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                    </>
                  )}
                  
                  {/* Drawing shapes */}
                  {shapes.map(shape => {
                    if (shape.type === 'line') {
                      return (
                        <Line
                          key={shape.id}
                          id={shape.id}
                          points={shape.points}
                          stroke={shape.color}
                          strokeWidth={3}
                          onClick={() => !activeTool && setSelectedId(shape.id)}
                          opacity={selectedId === shape.id || selectedItems.includes(shape.id) ? 0.7 : 1}
                          draggable={true}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                        />
                      )
                    } else if (shape.type === 'arrow') {
                      return (
                        <Arrow
                          key={shape.id}
                          id={shape.id}
                          points={shape.points}
                          pointerLength={10}
                          pointerWidth={10}
                          stroke={shape.color}
                          strokeWidth={3}
                          onClick={() => !activeTool && setSelectedId(shape.id)}
                          opacity={selectedId === shape.id || selectedItems.includes(shape.id) ? 0.7 : 1}
                          draggable={true}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                        />
                      )
                    } else if (shape.type === 'box') {
                      return (
                        <Rect
                          key={shape.id}
                          id={shape.id}
                          x={shape.x}
                          y={shape.y}
                          width={shape.width}
                          height={shape.height}
                          stroke={shape.color}
                          strokeWidth={3}
                          fill="transparent"
                          onClick={() => !activeTool && setSelectedId(shape.id)}
                          opacity={selectedId === shape.id || selectedItems.includes(shape.id) ? 0.7 : 1}
                          draggable={true}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                        />
                      )
                    } else if (shape.type === 'circle') {
                      return (
                        <Ellipse
                          key={shape.id}
                          id={shape.id}
                          x={shape.x + shape.width / 2}
                          y={shape.y + shape.height / 2}
                          radiusX={Math.abs(shape.width / 2)}
                          radiusY={Math.abs(shape.height / 2)}
                          stroke={shape.color}
                          strokeWidth={3}
                          fill="transparent"
                          onClick={() => !activeTool && setSelectedId(shape.id)}
                          opacity={selectedId === shape.id || selectedItems.includes(shape.id) ? 0.7 : 1}
                          draggable={true}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          dragBoundFunc={(pos) => {
                            // Store position relative to center rather than top-left
                            return {
                              x: pos.x,
                              y: pos.y
                            };
                          }}
                        />
                      )
                    } else if (shape.type === 'football') {
                      return (
                        <Circle
                          key={shape.id}
                          id={shape.id}
                          x={shape.x}
                          y={shape.y}
                          radius={shape.radius}
                          fill="#FFFFFF"
                          stroke="#000000"
                          strokeWidth={1}
                          onClick={() => !activeTool && setSelectedId(shape.id)}
                          opacity={selectedId === shape.id ? 0.7 : 1}
                          draggable={true}
                          onDragStart={handleDragStart}
                          onDragEnd={(e) => {
                            const id = e.target.id();
                            const updatedShapes = shapes.map(s => {
                              if (s.id === id) {
                                return {
                                  ...s,
                                  x: e.target.x(),
                                  y: e.target.y()
                                };
                              }
                              return s;
                            });
                            setShapes(updatedShapes);
                            setActionTaken(true);
                          }}
                        />
                      )
                    } else if (shape.type === 'cone') {
                      return (
                        <Group
                          key={shape.id}
                          id={shape.id}
                          x={shape.x}
                          y={shape.y}
                          onClick={() => !activeTool && setSelectedId(shape.id)}
                          opacity={selectedId === shape.id || selectedItems.includes(shape.id) ? 0.7 : 1}
                          draggable={true}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                        >
                          {/* Cone shape (triangle) */}
                          <Line
                            points={[0, -15, 10, 10, -10, 10]}
                            closed={true}
                            fill={shape.color}
                            stroke={shape.strokeColor}
                            strokeWidth={2}
                          />
                        </Group>
                      )
                    }
                    return null
                  })}
                  
                  {/* Currently drawing shape */}
                  {newShape && (() => {
                    if (newShape.type === 'line') {
                      return (
                        <Line
                          points={newShape.points}
                          stroke={newShape.color}
                          strokeWidth={3}
                          dashEnabled={true}
                          dash={[5, 5]}
                        />
                      )
                    } else if (newShape.type === 'arrow') {
                      return (
                        <Arrow
                          points={newShape.points}
                          pointerLength={10}
                          pointerWidth={10}
                          stroke={newShape.color}
                          strokeWidth={3}
                          dashEnabled={true}
                          dash={[5, 5]}
                        />
                      )
                    } else if (newShape.type === 'box') {
                      return (
                        <Rect
                          x={newShape.x}
                          y={newShape.y}
                          width={newShape.width}
                          height={newShape.height}
                          stroke={newShape.color}
                          strokeWidth={3}
                          dashEnabled={true}
                          dash={[5, 5]}
                          fill="transparent"
                        />
                      )
                    } else if (newShape.type === 'circle') {
                      return (
                        <Ellipse
                          x={newShape.x + newShape.width / 2}
                          y={newShape.y + newShape.height / 2}
                          radiusX={Math.abs(newShape.width / 2)}
                          radiusY={Math.abs(newShape.height / 2)}
                          stroke={newShape.color}
                          strokeWidth={3}
                          dashEnabled={true}
                          dash={[5, 5]}
                          fill="transparent"
                        />
                      )
                    }
                    return null
                  })()}
                  
                  {(() => {
                    if (selectionBox) {
                      return (
                        <Rect
                          x={selectionBox.x}
                          y={selectionBox.y}
                          width={selectionBox.width}
                          height={selectionBox.height}
                          fill="rgba(0, 150, 255, 0.1)"
                          stroke="rgba(0, 150, 255, 0.8)"
                          strokeWidth={1}
                          dash={[5, 5]}
                        />
                      )
                    }
                    return null
                  })()}
                  
                  {/* Players */}
                  {players.map(player => (
                    <Group
                      key={player.id}
                      id={player.id}
                      x={player.x}
                      y={player.y}
                      draggable={true}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onClick={() => !activeTool && setSelectedId(player.id)}
                      opacity={selectedId === player.id || selectedItems.includes(player.id) ? 0.7 : 1}
                    >
                      <Circle
                        id={player.id}
                        x={0}
                        y={0}
                        radius={playerRadius}
                        fill={player.color}
                        stroke="#000000"
                        strokeWidth={2}
                      />
                      <Text
                        x={-4}
                        y={-6}
                        text={typeof playerNumbers[player.id] === 'object' 
                          ? playerNumbers[player.id]?.number || '' 
                          : playerNumbers[player.id]?.toString() || ''}
                        fill="#FFFFFF"
                        fontSize={12}
                        fontStyle="bold"
                      />
                      {playerNumbers[player.id]?.name && (
                        <Text
                          x={-playerRadius}
                          y={playerRadius + 5}
                          text={playerNumbers[player.id].name}
                          fill="#000000"
                          fontSize={10}
                          width={playerRadius * 2}
                          align="center"
                        />
                      )}
                    </Group>
                  ))}
                </Layer>
              </Stage>
              <div className="fullscreen-button" onClick={toggleFullscreen}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {isFullscreen ? (
                    // Exit fullscreen icon
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                  ) : (
                    // Enter fullscreen icon
                    <path d="M3 8V5a2 2 0 0 1 2-2h3m6 0h3a2 2 0 0 1 2 2v3m0 6v3a2 2 0 0 1-2 2h-3m-6 0H5a2 2 0 0 1-2-2v-3" />
                  )}
                </svg>
              </div>
            </>
          ) : viewMode === 'save' ? (
            <div className="save-load-container">
              <h2>Save Tactics Board</h2>
              <div className="save-input-row">
                <input
                  type="text"
                  value={currentSaveName}
                  onChange={(e) => setCurrentSaveName(e.target.value)}
                  placeholder="Enter a name for this save"
                  className="save-name-input"
                />
                <button 
                  onClick={handleSave}
                  disabled={!currentSaveName.trim()}
                  className={!currentSaveName.trim() ? 'disabled' : ''}
                >
                  {selectedSaveIndex !== -1 ? 'Update' : 'Save New'}
                </button>
                <button 
                  onClick={handleDeleteSave}
                  disabled={selectedSaveIndex === -1}
                  className={selectedSaveIndex === -1 ? 'disabled' : ''}
                >
                  Delete
                </button>
                <button onClick={handleCancelSaveLoad}>Cancel</button>
              </div>
              
              {showOverwriteConfirm && (
                <div className="overwrite-confirm">
                  <p>Are you sure you want to overwrite "{savedBoards[selectedSaveIndex].name}"?</p>
                  <div className="confirm-buttons">
                    <button onClick={handleSave}>Yes, Overwrite</button>
                    <button onClick={() => setShowOverwriteConfirm(false)}>Cancel</button>
                  </div>
                </div>
              )}
              
              {showDeleteConfirm && (
                <div className="overwrite-confirm delete-confirm">
                  <p>Are you sure you want to delete "{savedBoards[selectedSaveIndex].name}"?</p>
                  <div className="confirm-buttons">
                    <button onClick={handleDeleteSave}>Yes, Delete</button>
                    <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                  </div>
                </div>
              )}
              
              <div className="saved-boards-list">
                <h3>Existing Saves</h3>
                {savedBoards.length === 0 ? (
                  <p className="no-saves-message">No saved boards yet. Create your first one!</p>
                ) : (
                  <div className="board-items">
                    {savedBoards.map((board, index) => (
                      <div 
                        key={index}
                        className={`board-item ${selectedSaveIndex === index ? 'selected' : ''}`}
                        onClick={() => handleSelectSave(index)}
                      >
                        <div className="board-name">{board.name}</div>
                        <div className="board-date">{new Date(board.date).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : viewMode === 'load' ? (
            <div className="save-load-container">
              <h2>Load Tactics Board</h2>
              <div className="save-input-row">
                <input
                  type="text"
                  value={currentSaveName}
                  placeholder="Select a save to load"
                  readOnly
                  className="save-name-input"
                />
                <button 
                  onClick={handleLoad}
                  disabled={selectedSaveIndex === -1}
                  className={selectedSaveIndex === -1 ? 'disabled' : ''}
                >
                  Load
                </button>
                <button onClick={handleCancelSaveLoad}>Cancel</button>
              </div>
              
              <div className="saved-boards-list">
                <h3>Available Boards</h3>
                {savedBoards.length === 0 ? (
                  <p className="no-saves-message">No saved boards available to load.</p>
                ) : (
                  <div className="board-items">
                    {savedBoards.map((board, index) => (
                      <div 
                        key={index}
                        className={`board-item ${selectedSaveIndex === index ? 'selected' : ''}`}
                        onClick={() => handleSelectSave(index)}
                      >
                        <div className="board-name">{board.name}</div>
                        <div className="board-date">{new Date(board.date).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Team Dialog */}
      {showTeamDialog && (
        <div className="modal-overlay">
          <div className="team-dialog">
            <div className="team-dialog-header">
              <h2>Create Team</h2>
              <button className="close-button" onClick={closeTeamDialog}>×</button>
            </div>
            
            <div className="team-dialog-body">
              <div className="team-options">
                <div className="formation-options">
                  <label>Formation:</label>
                  <div className="formation-buttons">
                    <button 
                      className={teamDialogData.formation === '442' ? 'active' : ''} 
                      onClick={() => handleTeamDialogFormationChange('442')}
                    >
                      4-4-2
                    </button>
                    <button 
                      className={teamDialogData.formation === '433' ? 'active' : ''} 
                      onClick={() => handleTeamDialogFormationChange('433')}
                    >
                      4-3-3
                    </button>
                    <button 
                      className={teamDialogData.formation === '4231' ? 'active' : ''} 
                      onClick={() => handleTeamDialogFormationChange('4231')}
                    >
                      4-2-3-1
                    </button>
                    <button 
                      className={teamDialogData.formation === '532' ? 'active' : ''} 
                      onClick={() => handleTeamDialogFormationChange('532')}
                    >
                      5-3-2
                    </button>
                  </div>
                </div>
                
                <div className="side-options">
                  <label>Side:</label>
                  <div className="side-buttons">
                    <button 
                      className={teamDialogData.side === 'left' ? 'active' : ''} 
                      onClick={() => handleTeamDialogSideChange('left')}
                    >
                      Left
                    </button>
                    <button 
                      className={teamDialogData.side === 'right' ? 'active' : ''} 
                      onClick={() => handleTeamDialogSideChange('right')}
                    >
                      Right
                    </button>
                  </div>
                </div>
                
                <div className="color-option">
                  <label>Team Color:</label>
                  <div className="color-picker">
                    <div 
                      className="color-preview" 
                      style={{ backgroundColor: teamDialogData.teamColor }}
                    ></div>
                    <input 
                      type="color" 
                      value={teamDialogData.teamColor} 
                      onChange={(e) => handleTeamDialogColorChange(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="player-inputs">
                <div className="player-input-headers">
                  <div className="player-number-header">Number</div>
                  <div className="player-name-header">Name</div>
                </div>
                
                {teamDialogData.numbers.map((number, index) => (
                  <div key={index} className="player-input-row">
                    <div className="player-position">
                      {index === 0 ? 'GK' : getPositionAbbreviation(teamDialogData.formation, index)}
                    </div>
                    <input 
                      type="text" 
                      className="player-number-input" 
                      value={number} 
                      onChange={(e) => handleTeamDialogInputChange(e, index, 'numbers')} 
                      placeholder={`#${index + 1}`}
                    />
                    <input 
                      type="text" 
                      className="player-name-input" 
                      value={teamDialogData.names[index]} 
                      onChange={(e) => handleTeamDialogInputChange(e, index, 'names')} 
                      placeholder="Player name"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="team-dialog-footer">
              <button className="cancel-button" onClick={closeTeamDialog}>Cancel</button>
              <button className="confirm-button" onClick={handleTeamDialogSubmit}>Confirm</button>
            </div>
          </div>
        </div>
      )}
      
      {showNumberEditor && editingPlayer && (
        <div className="number-editor-overlay">
          <div className="number-editor">
            <h3>Edit Player Number</h3>
            <form onSubmit={handleNumberSubmit}>
              <input 
                type="text" 
                value={newPlayerNumber} 
                onChange={handleNumberChange}
                placeholder="Number"
                pattern="[0-9]*"
                inputMode="numeric"
                autoFocus
              />
              <input 
                type="text" 
                value={newPlayerName} 
                onChange={handleNameChange}
                placeholder="Player name"
              />
              <div className="buttons">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setShowNumberEditor(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Player Edit Dialog */}
      {showPlayerEditDialog && (
        <div className="modal-overlay">
          <div className="player-edit-dialog">
            <div className="player-edit-header">
              <h2>Edit Player</h2>
              <button className="close-button" onClick={closePlayerEditDialog}>×</button>
            </div>
            
            <div className="player-edit-body">
              <div className="player-edit-form">
                <div className="form-group">
                  <label>Number:</label>
                  <input 
                    type="text" 
                    value={editingPlayerData.number} 
                    onChange={(e) => handlePlayerEditInputChange(e, 'number')} 
                    placeholder="Player number"
                  />
                </div>
                <div className="form-group">
                  <label>Name:</label>
                  <input 
                    type="text" 
                    value={editingPlayerData.name} 
                    onChange={(e) => handlePlayerEditInputChange(e, 'name')} 
                    placeholder="Player name"
                  />
                </div>
              </div>
            </div>
            
            <div className="player-edit-footer">
              <button className="cancel-button" onClick={closePlayerEditDialog}>Cancel</button>
              <button className="confirm-button" onClick={handlePlayerEditSubmit}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showConsole && (
        <div className="console-overlay">
          <div className="console-container">
            <div className="console-header">
              <h3>Feedback Console</h3>
              <button className="close-button" onClick={() => setShowConsole(false)}>×</button>
            </div>
            
            <div className="console-output">
              {consoleHistory.length > 0 ? (
                consoleHistory.map((entry, index) => (
                  <div key={index} className="console-entry">
                    <span className="console-timestamp">[{entry.timestamp}]</span>
                    <span className="console-message">{entry.text}</span>
                  </div>
                ))
              ) : (
                <div className="console-placeholder">Type your feedback for the developer</div>
              )}
            </div>
            
            <form className="console-input-container" onSubmit={handleConsoleSubmit}>
              <input
                ref={consoleInputRef}
                type="text"
                className="console-input"
                value={consoleInput}
                onChange={handleConsoleInput}
                placeholder="Type your feedback here..."
              />
              <button type="submit" className="console-send-button">Send</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
